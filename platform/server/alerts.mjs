export async function sendAlert(kind,detail={}){
 const endpoint=process.env.PLATFORM_ALERT_WEBHOOK;if(!endpoint)return false;
 const url=new URL(endpoint);if(url.protocol!=='https:')throw new Error('Alert webhook must use HTTPS.');
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service:'lumiq',environment:process.env.PLATFORM_MODE||'unknown',kind,detail,at:new Date().toISOString()}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new Error('Alert delivery failed.');return true;
}
