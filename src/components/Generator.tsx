import { createSignal, For, Show, onMount } from "solid-js";
import MessageItem from "./MessageItem";
import IconClear from "./icons/Clear";
import IconLoading from "./icons/Loading";
import type { ChatMessage } from "../types";

export default () => {
  let inputRef: HTMLInputElement;
  const [messageList, setMessageList] = createSignal<ChatMessage[]>([]);
  const [currentAssistantMessage, setCurrentAssistantMessage] =
    createSignal("");
  const [loading, setLoading] = createSignal(false);

  onMount(async () => {
    renderT(
      "你好！我是chatgpt，被称为人工智能语言模型，可以回答问题、提供建议、进行对话、理解人类的语言并与人类进行交互。使用我需要收取费用，如果我能给你带来帮助，可以点击右上角红包赞赏一下作者~"
    );
    
  });
  const renderT = async (content)=>{
    let str = "";
    function delaysum(e, i) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          str += e;
          resolve(str);
        }, 8 * i);
      });
    }
    const arr = content.split("");
    arr.forEach(async (element, i) => {
      await delaysum(element, i);
      setMessageList([
        {
          role: "assistant",
          content: str,
        },
      ]);
    });
  }

  const handleButtonClick = async () => {
    const inputValue = inputRef.value;
    let scrollele = document.getElementById('scrollele')
    
    if (!inputValue) {
      return;
    }
    setLoading(true);
    // @ts-ignore
    // if (window?.umami) umami.trackEvent("chat_generate");
    inputRef.value = "";
    setMessageList([
      ...messageList(),
      {
        role: "user",
        content: inputValue,
      },
    ]);

    let escrollHeight = scrollele.scrollHeight;
    let eclientHeight = scrollele.clientHeight;
    if(escrollHeight > eclientHeight){
      scrollele.scrollTo({
        top: escrollHeight,
        behavior: 'smooth'
      })
    }

    const response = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({
        messages: messageList(),
      }),
    });
    let errormsg = ''
    const data = response.body;
    if (!response.ok) {
      errormsg = '⚠️⚠️⚠️数据量过大，请求出现了问题，请清除数据或刷新页面后重试~'
    }
    if (!data) {
      errormsg = '🤣🤣🤣数据丢失了~'
    }
    if(errormsg){
      setMessageList([
        ...messageList(),
        {
          role: "assistant",
          content: errormsg,
        },
      ])
      setLoading(false);
      throw new Error(errormsg);
    }

    const reader = data.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;

    while (!done) {
      let escrollHeight = scrollele.scrollHeight;
      let eclientHeight = scrollele.clientHeight;
      const { value, done: readerDone } = await reader.read();
      if (value) {
        let char = decoder.decode(value);
        if (char === "\n" && currentAssistantMessage().endsWith("\n")) {
          continue;
        }
        if (char) {
          setCurrentAssistantMessage(currentAssistantMessage() + char);
          if(escrollHeight > eclientHeight){
            scrollele.scrollTo({
              top: escrollHeight,
              behavior: 'smooth'
            })
          }
        }
      }
      done = readerDone;
    }
    setMessageList([
      ...messageList(),
      {
        role: "assistant",
        content: currentAssistantMessage(),
      },
    ]);
    setCurrentAssistantMessage("");
    setLoading(false);
  };

  const clear = () => {
    inputRef.value = "";
    setMessageList([]);
    setCurrentAssistantMessage("");
  };

  return (
    <div class="h-76%" style="overflow: hidden;">
      <div id="scrollele" style="height: 100%;overflow-y: auto;overflow-x: hidden;">
        <For each={messageList()}>
          {(message) => (
            <MessageItem role={message.role} message={message.content} />
          )}
        </For>
        {currentAssistantMessage() && (
          <MessageItem role="assistant" message={currentAssistantMessage} />
        )}
      </div>
      <div class="fixed widthmain bottom-4 left-50% translate">
        <Show
          when={!loading()}
          fallback={() => (
            <div class="h-12 widthmain my-4 flex items-center justify-center bg-slate bg-op-15 text-slate rounded-sm">
              <div mr-2>Ai is thinking </div>
              <IconLoading />
            </div>
          )}
        >
          <div class="my-4 flex items-center justify-center gap-2">
            <input
              ref={inputRef!}
              type="text"
              id="input"
              placeholder="Enter something..."
              autocomplete="off"
              autofocus
              disabled={loading()}
              onKeyDown={(e) => {
                e.key === "Enter" && !e.isComposing && handleButtonClick();
              }}
              w-full
              px-4
              h-12
              text-slate
              rounded-sm
              bg-slate
              bg-op-15
              focus:bg-op-20
              focus:ring-0
              focus:outline-none
              placeholder:text-slate-400
              placeholder:op-30
            />
            <button
              onClick={handleButtonClick}
              disabled={loading()}
              h-12
              px-4
              py-2
              bg-slate
              bg-op-15
              hover:bg-op-20
              text-slate
              rounded-sm
            >
              Send
            </button>
            <button
              title="Clear"
              onClick={clear}
              disabled={loading()}
              h-12
              px-4
              py-2
              bg-slate
              bg-op-15
              hover:bg-op-20
              text-slate
              rounded-sm
            >
              <IconClear />
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
};
