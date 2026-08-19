const express=require('express');
const path=require('path');
const {listIncidents,getIncident,getDismissals,readFileSafe,dbPath,vaultRoot}=require('./services/evidenceService');
function basic(req,res,next){
 const user=process.env.EVIDENCE_OFFICER_USER||'officer', pass=process.env.EVIDENCE_OFFICER_PASSWORD||'officer123';
 const h=req.headers.authorization||'';if(!h.startsWith('Basic ')){res.set('WWW-Authenticate','Basic realm="Evidence Vault"');return res.status(401).send('Evidence Officer login required');}
 const [u,p]=Buffer.from(h.slice(6),'base64').toString().split(':');if(u!==user||p!==pass){res.set('WWW-Authenticate','Basic realm="Evidence Vault"');return res.status(401).send('Invalid Evidence Officer credentials');}next();
}
function startEvidenceVault(){
 const app=express();const port=Number(process.env.EVIDENCE_VAULT_PORT||8080);app.use(basic);app.use('/vendor/rrweb',express.static(path.join(__dirname,'node_modules','rrweb','dist')));app.use('/vendor/rrweb-player',express.static(path.join(__dirname,'node_modules','rrweb-player')));app.use(express.static(path.join(__dirname,'evidence-vault-public')));
 app.get('/api/incidents',async(_q,res)=>res.json({success:true,incidents:await listIncidents()}));
 app.get('/api/incidents/:code',async(req,res)=>{const row=await getIncident(req.params.code);if(!row)return res.status(404).json({success:false});const dismissals=await getDismissals(req.params.code);res.json({success:true,incident:row,dismissals})});
 app.get('/api/incidents/:code/file/:name',async(req,res)=>{try{const row=await getIncident(req.params.code);if(!row)return res.sendStatus(404);const b=readFileSafe(row,req.params.name);const n=req.params.name;if(n.endsWith('.png'))res.type('png');else if(n.endsWith('.jpg'))res.type('jpg');else if(n.endsWith('.webm'))res.type('video/webm');else if(n.endsWith('.html'))res.type('html');else res.type('json');res.send(b)}catch(e){res.status(404).send('Evidence file not found')}});
 app.get('/api/health',(_q,res)=>res.json({success:true,database:dbPath,vault:vaultRoot}));
 const server=app.listen(port,'127.0.0.1',()=>console.log(`Evidence Vault running on http://127.0.0.1:${port}`));server.on('error',e=>console.error(`Evidence Vault startup error on port ${port}:`,e.message));return server;
}
module.exports={startEvidenceVault};
