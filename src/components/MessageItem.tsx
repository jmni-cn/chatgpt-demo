import type { Accessor } from 'solid-js'
import type { ChatMessage } from '../types'
import MarkdownIt from 'markdown-it'
// @ts-ignore
import mdKatex from 'markdown-it-katex'
import mdHighlight from 'markdown-it-highlightjs'
import IconAssistant from "./icons/Assistant";
import IconUser from "./icons/User";

interface Props {
  role: ChatMessage['role']
  message: Accessor<string> | string
}

export default ({ role, message }: Props) => {
  const htmlString = () => {
    const md = MarkdownIt().use(mdKatex).use(mdHighlight)

    if (typeof message === 'function') {
      return md.render(message())
    } else if (typeof message === 'string') {
      return md.render(message)
    }
    return ''
  }
  return (
    <div class={`flex py-2 gap-3 -mx-4 px-4 rounded-lg transition-colors md:hover:bg-slate/3 ${ role }`}>
      {
        role !=='user' ? <div class={ `shrink-0 w-9 h-9 rounded-full` }>
          <IconAssistant/>
        </div> :''
      }
      <div class="message prose break-words overflow-hidden" innerHTML={htmlString()} />

      {
        role ==='user' ? <div class={ `shrink-0 w-9 h-9 rounded-full` }>
          <IconUser />
        </div> :''
      }
    </div>
  )
}