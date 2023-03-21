import { Show } from 'solid-js'
import type { Accessor, Setter } from 'solid-js'
import IconUp from './icons/Up'
import IconDown from './icons/Down'
import IconGear from './icons/Gear'
import IconPerson from './icons/Person'

interface Props {
  canEdit: Accessor<boolean>
  systemRoleEditing: Accessor<boolean>
  setSystemRoleEditing: Setter<boolean>
  currentSystemRoleSettings: Accessor<string>
  setCurrentSystemRoleSettings: Setter<string>
}

export default (props: Props) => {
  let systemInputRef: HTMLTextAreaElement

  const handleButtonClick = () => {
    if(!systemInputRef.value) return 
    props.setCurrentSystemRoleSettings(systemInputRef.value)
    props.setSystemRoleEditing(false)
    localStorage.setItem('systemRoleSettings', systemInputRef.value)
  }

  return (
    <div class="my-2 relative">
        <div>
          <div class="fi gap-1 absolute bottom-10 w-full" >
          <Show when={props.systemRoleEditing()}>
              <div class='system  w-full p-3 bg-op-15 hover:bg-op-20 rounded'>
                <p class="leading-normal text-xs fi"> <span class='mr-4'><IconPerson /></span>设置系统角色人格/行为 { (props.canEdit() || props.currentSystemRoleSettings())? '' : <span text-red-500 ml-2>设置前需要清除当前会话</span> }</p>
                <Show when={!props.currentSystemRoleSettings()}>
                    {
                      props.canEdit() ? 
                        <div class='flex mt-2'>
                          <textarea
                            class='text-sm'
                            ref={systemInputRef!}
                            placeholder="你是一位总是以苏格拉底风格回应的导师..."
                            autocomplete="off"
                            autofocus
                            rows="3"
                            gen-textarea
                          />
                          <button class='ml-4' onClick={handleButtonClick} gen-slate-btn>Set</button>
                        </div>
                      : ''
                    }
                </Show>
                <Show when={props.currentSystemRoleSettings() }>
                  <div class="mt-1 text-sm pl-8 pr-8 text-slate">
                    { props.currentSystemRoleSettings() }
                  </div>
                </Show>
              </div>
            </Show>
            {/* <div class='w-full p-3 bg-(slate op-15) hover:bg-op-20 rounded'>
              openAi Api
            </div> */}
          </div>
          <div class='flex items-center'>
            <span class='flex items-center cursor-pointer mx-1 p-2 hover:bg-slate hover:bg-op-10 rounded text-1.2em' onClick={() => props.setSystemRoleEditing(!props.systemRoleEditing())}><IconGear /></span>
          </div>
        </div>
    </div>
  )
}
