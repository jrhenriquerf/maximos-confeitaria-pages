const config=JSON.parse(document.querySelector('#feedback-config').textContent);
const form=document.querySelector('#feedback-form');
const status=document.querySelector('#form-status');
const button=document.querySelector('#submit');
const fields=document.querySelector('#fields');
const requestId=crypto.randomUUID();
let submission=null;
if(config.whatsappNumber) document.querySelector('#contact').href=`https://wa.me/${config.whatsappNumber}`;
if(!config.endpoint){status.textContent='O formulário está sendo preparado. Enquanto isso, fale com a gente pelo atendimento.';button.disabled=true;fields.disabled=true;}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(button.disabled||!config.endpoint)return;
 if(!submission){const data=new FormData(form);if(!['yes','no'].includes(data.get('consent'))){status.textContent='Escolha se autoriza a divulgação ou se deseja enviar apenas para a equipe.';form.reportValidity();return;}submission={request_id:requestId,rating:Number(data.get('rating')),message:data.get('message'),display_name:data.get('display_name')||'',product:data.get('product')||'',consent:data.get('consent')==='yes',anonymous:data.has('anonymous')||!String(data.get('display_name')||'').trim(),consent_version:'2026-11-17-v1',source:(new URLSearchParams(location.search).get('origem')||'catalogo').slice(0,80),website:data.get('website')||''};}
 fields.disabled=true;button.disabled=true;button.textContent='Enviando…';status.textContent='';
 try{const response=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(submission),signal:AbortSignal.timeout(20000)});const result=await response.json();if(!response.ok||result.received!==true){if(response.status===400){submission=null;fields.disabled=false;}throw new Error(result.error||'Não foi possível confirmar o envio.');}
 document.querySelector('#form-area').hidden=true;const success=document.querySelector('#success');success.hidden=false;success.focus();submission=null;form.reset();
 }catch(error){status.textContent=`${error.name==='TimeoutError'||error instanceof TypeError?'Não foi possível confirmar o envio. Confira sua conexão.':error.message} Use o botão para tentar novamente.`;button.disabled=false;button.textContent='Tentar enviar novamente ↗';}
});
