import type { APIRoute } from 'astro'

const realPassword = import.meta.env.SITE_PASSWORD

// type jmniJson = {
//   ts:number,
//   success?:boolean,
//   data?:string,
//   code?:number
// }
export const post: APIRoute = async (context) => {
  const body = await context.request.json()
  // let jmniJson :any
  // try{
  //   const jmni = await fetch('http://api.example.cn/')
  //   jmniJson = await jmni.json()
  // }catch(e){
  //   jmniJson = {
  //     ts: new Date().getTime(),
  //     success: false
  //   }
  // }
  const { pass } = body
  return new Response(JSON.stringify({
    code: (!realPassword || realPassword.includes(pass)) ? 0 : -1,
    // ts: jmniJson.ts,
    // success: jmniJson.success,
  }))
}
