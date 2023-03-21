import type { ChatMessage } from '../types'
import { createSignal, For, Index, Show, onMount, onCleanup } from 'solid-js'
import IconClear from './icons/Clear'
import IconLoading from "./icons/Loading";
import MessageItem from './MessageItem'
import SystemRoleSettings from './SystemRoleSettings'
import { generateSignature } from '../utils'
import { useThrottleFn } from 'solidjs-use'

export default () => {
  let inputRef: HTMLTextAreaElement
  const [currentSystemRoleSettings, setCurrentSystemRoleSettings] = createSignal('')
  const [systemRoleEditing, setSystemRoleEditing] = createSignal(false)
  const [messageList, setMessageList] = createSignal<ChatMessage[]>([])
  const [currentAssistantMessage, setCurrentAssistantMessage] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [controller, setController] = createSignal<AbortController>(null)
  const [noticeMessage, setNoticeMessage] = createSignal('')


  onMount(() => {
    init();
    window.addEventListener('beforeunload', handleBeforeUnload)
    onCleanup(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    })
  })

  const init = () => {
    async function checkCurrentAuth() {
      const password = localStorage.getItem('sign-key')
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pass: password,
        }),
      })
      const responseJson = await response.json()
      if (responseJson.code !== 0) {
        window.location.href = '/password'
      }else{
        try {
          if (localStorage.getItem('systemRoleSettings')) {
            setCurrentSystemRoleSettings(localStorage.getItem('systemRoleSettings'))
          }
          if (localStorage.getItem('messageList') && localStorage.getItem('messageList')!== '[]') {
            setMessageList(JSON.parse(localStorage.getItem('messageList')))
          }else{
            renderT(
              `
              :Hi~ 我是chatgpt！/
              b
              :一名AI语言模型，我能够理解和回答用户的问题，提供相关的信息和建议。可以通过不断学习和优化，能够不断提高自己的表现和服务质量。/
              b
              :在日常生活中，我可以帮助人们解决各种问题，例如提供天气预报、回答知识问题、提供路线规划、周报文案、PPT大纲、旅游规划等等。为人们的生活提供更多的便利和服务。/
              b
              :如果我能给你带来帮助，可以点击右上角红包赞赏一下作者~ /
              `
            );
          }
        } catch (err) {
          console.error(err)
        }
      }
    }
    checkCurrentAuth()
  }
  const renderT = async (content)=>{
    let str = "";
    function delaysum(e, i) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          e = (e === ':' ? '<p>' : e === '/' ? '</p>' : e === 'b' ? '<br>' : e)
          str += e;
          resolve(str);
        }, 40 * i);
      });
    }
    const arr = content.split("");
    arr.forEach(async (element, i) => {
      await delaysum(element, i);
      setNoticeMessage(str)
    });
  }
  
  const handleBeforeUnload = () => {
    localStorage.setItem('messageList', JSON.stringify(messageList()))
    localStorage.setItem('systemRoleSettings', currentSystemRoleSettings())
  }

  const handleButtonClick = async () => {
    const inputValue = inputRef.value
    if (!inputValue) {
      return
    }
    inputRef.value = ''
    setMessageList([
      ...messageList(),
      {
        role: 'user',
        content: inputValue,
      },
    ])
    requestWithLatestMessage()
  }

  const smoothToBottom = useThrottleFn(() => {
    let dom = document.getElementById('scrollele')
    dom.scrollTo({ top:dom.scrollHeight, behavior: 'smooth' })
  }, 300, false, true)

  const requestWithLatestMessage = async () => {
    smoothToBottom()
    setLoading(true)
    setCurrentAssistantMessage('')
    const storagePassword = localStorage.getItem('sign-key')
    try {
      const controller = new AbortController()
      setController(controller)
      const requestMessageList = [...messageList()]
      if (currentSystemRoleSettings()) {
        requestMessageList.unshift({
          role: 'system',
          content: currentSystemRoleSettings(),
        })
      }
      const timestamp = Date.now()
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          messages: requestMessageList,
          time: timestamp,
          pass: storagePassword,
          sign: await generateSignature({
            t: timestamp,
            m: requestMessageList?.[requestMessageList.length - 1]?.content || '',
          }),
        }),
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(response.statusText)
      }
      const data = response.body
      if (!data) {
        throw new Error('No data')
      }
      const reader = data.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        if (value) {
          let char = decoder.decode(value)
          if (char === '\n' && currentAssistantMessage().endsWith('\n')) {
            continue
          }
          if (char) {
            setCurrentAssistantMessage(currentAssistantMessage() + char)
          }
          smoothToBottom()
        }
        done = readerDone
      }
    } catch (e) {
      console.error(e)
      setLoading(false)
      setController(null)
      return
    }
    archiveCurrentMessage()
  }

  const archiveCurrentMessage = () => {
    if (currentAssistantMessage()) {
      setMessageList([
        ...messageList(),
        {
          role: 'assistant',
          content: currentAssistantMessage(),
        },
      ])
      setCurrentAssistantMessage('')
      setLoading(false)
      setController(null)
      inputRef.focus()
    }
  }

  const clear = () => {
    inputRef.value = ''
    inputRef.style.height = 'auto';
    setMessageList([])
    setCurrentAssistantMessage('')
    setCurrentSystemRoleSettings('')
  }

  const stopStreamFetch = () => {
    if (controller()) {
      controller().abort()
      archiveCurrentMessage()
    }
  }

  const retryLastFetch = () => {
    if (messageList().length > 0) {
      const lastMessage = messageList()[messageList().length - 1]
      console.log(lastMessage)
      if (lastMessage.role === 'assistant') {
        setMessageList(messageList().slice(0, -1))
        requestWithLatestMessage()
      }
    }
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.isComposing || e.shiftKey) {
      return
    }
    if (e.key === 'Enter') {
      handleButtonClick()
    }
  }

  return (
    <div class="h-80%" style="overflow: hidden;">
      <div id="scrollele" style="height: 100%;overflow-y: auto;overflow-x: hidden;padding: 0 1rem;">
      <Show when={ !messageList().length}>
          <div class='w-full h-full fi p-4'>
            {/* text-transparent font-extrabold bg-clip-text bg-gradient-to-r from-orange-300   
              to-blue-600 */}
              <div class='h-95%' innerHTML={noticeMessage()}></div>
          </div>
      </Show>
      <For each={messageList()}>
        {(message, index) => (
          <div>
            <MessageItem
            role={message.role}
            message={message.content}
            showRetry={() => (message.role === 'assistant' )}
            onRetry={retryLastFetch}
          />
          </div>
          
        )}
      </For>
      {currentAssistantMessage() && (
        <MessageItem
          role="assistant"
          message={currentAssistantMessage}
        />
      )}
      </div>
      <div class="fixed widthmain bottom-4 left-50% translate">
      <SystemRoleSettings
        canEdit={() => messageList().length === 0}
        systemRoleEditing={systemRoleEditing}
        setSystemRoleEditing={setSystemRoleEditing}
        currentSystemRoleSettings={currentSystemRoleSettings}
        setCurrentSystemRoleSettings={setCurrentSystemRoleSettings}
      />
      <Show
        when={!loading()}
        fallback={() => (
          <div class="h-12 widthmain my-4 flex items-center justify-center bg-slate bg-op-15 text-slate rounded-sm">
              <div mr-2>Ai is thinking </div>
              <IconLoading />
              <button class="gen-cb-stop ml-20 pl-1 pr-1 border-1 border-gray-400 rounded-2" onClick={stopStreamFetch}>Stop</button>
            </div>
        )}
      >
        <div class="gen-text-wrapper" class:op-50={systemRoleEditing()}>
          <textarea
            ref={inputRef!}
            disabled={systemRoleEditing()}
            onKeyDown={handleKeydown}
            placeholder="Enter something..."
            autocomplete="off"
            autofocus
            onInput={() => {
              inputRef.style.height = 'auto';
              inputRef.style.height = inputRef.scrollHeight + 'px';
            }}
            rows="1"
            class='gen-textarea'
          />
          <button onClick={handleButtonClick} disabled={systemRoleEditing()} gen-slate-btn>
            Send
          </button>
          <button title="Clear" onClick={clear} gen-slate-btn>
            <IconClear />
          </button>
        </div>
      </Show>
    </div>
    </div>
  )
}
