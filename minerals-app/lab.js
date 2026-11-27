/* L3 · a specimen in hand: its own a·b·c axes run through the picture, its hardness sits on the ring.
   L4 · the cabinet: what you collected, as drawers in the same space; the drawers stack along the axis you sort by,
   the one you open slides out toward you and the rest go out of focus. */
(()=>{
const lab=document.getElementById('lab'),x=lab.getContext('2d');let LW,LH;
function rsz(){const d=devicePixelRatio||1;LW=innerWidth;LH=innerHeight;lab.width=LW*d;lab.height=LH*d;lab.style.width=LW+'px';lab.style.height=LH+'px';x.setTransform(d,0,0,d,0,0)}
rsz();addEventListener('resize',rsz);
const C=a=>`rgba(${TH.ink},${a})`,MU=a=>`rgba(${TH.mute},${a})`,FONT=()=>TH.font;
const hard=p=>+((String(p.date).match(/Mohs ([\d.]+)/)||[])[1]||0),year=p=>p.y||+((String(p.date).match(/\d{4}/)||[])[0]||0);
const nm=p=>p.t.replace(/<[^>]+>/g,'');
const ease=t=>1-Math.pow(1-Math.min(1,Math.max(0,t)),3);
const store={get(k,d){try{return JSON.parse(localStorage.getItem('min.'+k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem('min.'+k,JSON.stringify(v))}catch(e){}}};
const W3=(v,r,cx,cy,f=1100)=>{   // turn about y, then x, then perspective
  let [a,b,c]=v;const cy_=Math.cos(r.y),sy=Math.sin(r.y),cx_=Math.cos(r.x),sx=Math.sin(r.x);
  let X=a*cy_+c*sy,Z=-a*sy+c*cy_,Y=b*cx_-Z*sx;Z=b*sx+Z*cx_;const k=f/(f-Z);return [cx+X*k,cy+Y*k,Z]};

/* ---------- L3 · the crystal's own axes ---------- */
const SYS={cubic:{a:1,b:1,c:1,al:90,be:90,ga:90,sh:'box',r:'a = b = c · all at 90°'},
  tetragonal:{a:.72,b:.72,c:1.15,al:90,be:90,ga:90,sh:'tet',r:'a = b ≠ c · all at 90°'},
  orthorhombic:{a:1,b:.7,c:1.3,al:90,be:90,ga:90,sh:'box',r:'a ≠ b ≠ c · all at 90°'},
  hexagonal:{a:.7,b:.7,c:1.3,al:90,be:90,ga:120,sh:'hex',r:'a = b ≠ c · γ = 120°'},
  trigonal:{a:1,b:1,c:1,al:70,be:70,ga:70,sh:'box',r:'a = b = c · α = β = γ ≠ 90°'},
  monoclinic:{a:1,b:.75,c:1.25,al:90,be:114,ga:90,sh:'box',r:'a ≠ b ≠ c · β ≠ 90°'},
  triclinic:{a:1,b:.8,c:1.2,al:76,be:108,ga:97,sh:'box',r:'a ≠ b ≠ c · α ≠ β ≠ γ ≠ 90°'}};
function basis(s){const r=d=>d*Math.PI/180,ca=Math.cos(r(s.al)),cb=Math.cos(r(s.be)),cg=Math.cos(r(s.ga)),sg=Math.sin(r(s.ga));
  const A=[s.a,0,0],B=[s.b*cg,s.b*sg,0],cy=(ca-cb*cg)/sg,Cv=[s.c*cb,s.c*cy,s.c*Math.sqrt(Math.max(0,1-cb*cb-cy*cy))];
  const w=v=>[v[0],-v[2],v[1]];return [w(A),w(B),w(Cv)]}   // c stands up, b goes into the page
function crystal(sysName){const s=SYS[sysName]||SYS.cubic,[A,B,Cv]=basis(s),V=[],E=[];
  const add=(...ps)=>ps.map(p=>V.push(p)-1);
  if(s.sh==='hex'){const r=s.a,h=s.c/2,top=[],bot=[];for(let k=0;k<6;k++){const t=k*Math.PI/3;top.push(add([r*Math.cos(t),-h,r*Math.sin(t)])[0]);bot.push(add([r*Math.cos(t),h,r*Math.sin(t)])[0])}
    for(let k=0;k<6;k++){E.push([top[k],top[(k+1)%6]],[bot[k],bot[(k+1)%6]],[top[k],bot[k]])}}
  else if(s.sh==='tet'){const a=s.a/2,h=s.c*.32,ap=s.c*.62,q=[[-a,-a],[a,-a],[a,a],[-a,a]],t=q.map(([u,v])=>add([u,-h,v])[0]),b=q.map(([u,v])=>add([u,h,v])[0]),[pt,pb]=add([0,-ap,0],[0,ap,0]);
    for(let k=0;k<4;k++)E.push([t[k],t[(k+1)%4]],[b[k],b[(k+1)%4]],[t[k],b[k]],[t[k],pt],[b[k],pb])}
  else{const ids={};for(const i of[-1,1])for(const j of[-1,1])for(const k of[-1,1])ids[[i,j,k]]=add([0,1,2].map(n=>(i*A[n]+j*B[n]+k*Cv[n])/2))[0];
    for(const i of[-1,1])for(const j of[-1,1]){E.push([ids[[-1,i,j]],ids[[1,i,j]]],[ids[[i,-1,j]],ids[[i,1,j]]],[ids[[i,j,-1]],ids[[i,j,1]]])}}
  const ctr=V.reduce((m,v)=>m.map((x,i)=>x+v[i]/V.length),[0,0,0]);V.forEach(v=>{for(let i=0;i<3;i++)v[i]-=ctr[i]});
  const R=Math.max(...V.map(v=>Math.hypot(...v)));return {V:V.map(v=>v.map(x=>x/R)),E,ax:[A,B,Cv].map(v=>{const l=Math.hypot(...v);return v.map(x=>x/l)}),s}}
const rot={x:-.32,y:.55,vx:0,vy:.0022};let XT=null,xt0=0,hardS=1;
function drawSpecimen(now){const p=focus;if(!p||!p.ar)return;const k=ease((now-xt0)/900);if(!XT||XT.p!==p){XT={p,...crystal(p.id)};xt0=now;hardS=1}
  const cr=card.getBoundingClientRect(),cx=cr.left+cr.width/2,cy=cr.top+cr.height/2,R0=Math.hypot(cr.width,cr.height)/2+14;
  if(drag!=='x'){rot.y+=rot.vy;rot.x+=( -.32-rot.x)*.01}
  const sc=R0*.98*(.7+.3*k);const P3=XT.V.map(v=>W3(v.map(z=>z*sc),rot,cx,cy));
  x.lineWidth=1;XT.E.forEach(([a,b])=>{const A=P3[a],B=P3[b],z=(A[2]+B[2])/2/sc;x.setLineDash(z<-.05?[2,3]:[]);x.strokeStyle=C((.25+.45*(z+1)/2)*k);x.beginPath();x.moveTo(A[0],A[1]);x.lineTo(B[0],B[1]);x.stroke()});
  x.setLineDash([]);
  // the axes run through the picture and out past the ring
  ['a','b','c'].forEach((n,i)=>{const d=XT.ax[i],L=R0*1.24*k,A=W3(d.map(v=>v*L),rot,cx,cy),B=W3(d.map(v=>-v*L),rot,cx,cy);
    x.strokeStyle=C(.5*k);x.beginPath();x.moveTo(B[0],B[1]);x.lineTo(A[0],A[1]);x.stroke();x.fillStyle=C(k);x.beginPath();x.arc(A[0],A[1],1.8,0,7);x.fill();
    x.font=`italic 400 13px ${FONT()}`;x.fillStyle=C(.9*k);const dx=A[0]-cx,dy=A[1]-cy,l=Math.hypot(dx,dy)||1;x.textAlign='center';x.fillText(n,A[0]+dx/l*12,A[1]+dy/l*12+4);x.textAlign='left'});
  // hardness on the ring: 1 at the left of the top arc, 10 at the right; the marker sweeps in from 1
  const h=hard(p);hardS+=(h-hardS)*.06;const ang=v=>(-160+(v-1)/9*140)*Math.PI/180,pt=(v,r)=>[cx+r*Math.cos(ang(v)),cy+r*Math.sin(ang(v))];
  for(let v=1;v<=10;v++){const [a1,b1]=pt(v,R0),[a2,b2]=pt(v,R0+(v%5?4:7));x.strokeStyle=C(.35*k);x.beginPath();x.moveTo(a1,b1);x.lineTo(a2,b2);x.stroke()}
  x.font=`italic 400 11px ${FONT()}`;x.fillStyle=MU(.8*k);[[1,'1 · talc'],[10,'10 · diamond']].forEach(([v,t])=>{const [a,b]=pt(v,R0+18);x.textAlign=v<5?'right':'left';x.fillText(t,a,b)});
  if(h){const [a,b]=pt(hardS,R0);x.fillStyle=TH.bg;x.strokeStyle=C(k);x.beginPath();x.arc(a,b,4,0,7);x.fill();x.stroke();x.fillStyle=C(k);x.beginPath();x.arc(a,b,1.4,0,7);x.fill();
    const [ta,tb]=pt(hardS,R0+20);x.textAlign='center';x.font=`400 12px ${FONT()}`;x.fillText('Mohs '+h,ta,tb);x.textAlign='left'}
  document.getElementById('sys').innerHTML=`<i>${p.id}</i>  ${XT.s.r}`}

/* ---------- toolbar under the specimen: lens · locate · note · collect ---------- */
let COL=store.get('col',null),NOTES=store.get('notes',{});
const tools=document.getElementById('tools'),tc=tools.querySelector('.tc'),note=document.getElementById('note'),lens=document.getElementById('lens');
let lensOn=false;
const isCol=p=>COL&&COL.includes(nm(p));
function syncTools(){if(!focus)return;tools.querySelector('[data-k=collect]').classList.toggle('on',isCol(focus));tools.querySelector('[data-k=lens]').classList.toggle('on',lensOn);
  const v=NOTES[nm(focus)]||'';if(document.activeElement!==note)note.value=v;note.classList.toggle('has',!!v);renderCab()}
const TIP={lens:'Hand lens',locate:'Where it was first found',note:'Field note',collect:'Collect'};
tools.querySelectorAll('button').forEach(b=>{b.onmouseenter=()=>{tc.textContent=b.dataset.k==='collect'&&focus&&isCol(focus)?'In your cabinet':TIP[b.dataset.k]};b.onmouseleave=()=>tc.textContent='';
  b.onclick=e=>{e.stopPropagation();const k=b.dataset.k,p=focus;if(!p)return;
    if(k==='lens'){lensOn=!lensOn;if(!lensOn)lens.classList.remove('on')}
    if(k==='note'){note.classList.add('open');note.focus()}
    if(k==='collect'){if(isCol(p))COL=COL.filter(n=>n!==nm(p));else{COL.push(nm(p));fly(p)}store.set('col',COL);tc.textContent=isCol(p)?'In your cabinet':'Collect'}
    if(k==='locate'){locate(p);return}
    syncTools()}});
note.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'||e.key==='Escape')note.blur()});
note.addEventListener('blur',()=>{if(!focus)return;const v=note.value.trim();if(v){NOTES[nm(focus)]=v;if(!isCol(focus)){COL.push(nm(focus));fly(focus)}}else delete NOTES[nm(focus)];store.set('notes',NOTES);store.set('col',COL);note.classList.toggle('open',!!v);syncTools()});
['pointerdown','click','dblclick'].forEach(t=>[tools,note].forEach(el=>el.addEventListener(t,e=>e.stopPropagation())));
card.addEventListener('mousemove',e=>{if(!lensOn||!focus)return;const r=card.getBoundingClientRect(),Z=2.6,s=130;lens.classList.add('on');
  lens.style.left=(e.clientX-s/2)+'px';lens.style.top=(e.clientY-s/2)+'px';lens.style.backgroundImage=`url("${focus.img}")`;lens.style.backgroundSize=`${r.width*Z}px ${r.height*Z}px`;
  lens.style.backgroundPosition=`${-(e.clientX-r.left)*Z+s/2}px ${-(e.clientY-r.top)*Z+s/2}px`});
card.addEventListener('mouseleave',()=>lens.classList.remove('on'));
card.addEventListener('click',e=>{if(lensOn){e.stopImmediatePropagation()}},true);   // with the lens up, a click looks closer instead of turning the card
const _sf=setFocus;setFocus=function(p){_sf(p);document.body.classList.add('held');note.classList.toggle('open',!!NOTES[nm(p)]);syncTools()};
const _uf=unfocus;unfocus=function(){_uf();document.body.classList.remove('held');lens.classList.remove('on');note.classList.remove('open');XT=null};

const FX=[];   // little rings in flight: collecting, locating
function fly(p){const r=card.getBoundingClientRect(),b=document.querySelector('#cab svg').getBoundingClientRect();FX.push({k:'fly',t0:performance.now(),a:[r.left+r.width/2,r.top+r.height/2],b:[b.left+b.width/2,b.top+b.height/2],R:Math.hypot(r.width,r.height)/2})}
function hemiOf(p){return HEMI.findIndex(H=>H.q.includes(quartOf(p.lon)))}
function locate(p){unfocus();goOut();setTimeout(()=>{setHemi(hemiOf(p));FX.push({k:'pin',t0:performance.now()+900,p})},350)}
function drawFX(now){for(let i=FX.length-1;i>=0;i--){const f=FX[i],t=(now-f.t0)/(f.k==='fly'?750:2600);if(t<0)continue;if(t>1){FX.splice(i,1);continue}
  if(f.k==='fly'){const e=ease(t),px=f.a[0]+(f.b[0]-f.a[0])*e,py=f.a[1]+(f.b[1]-f.a[1])*e-Math.sin(e*Math.PI)*80,r=f.R*(1-e)+7*e;x.strokeStyle=C(.5*(1-t*.4));x.beginPath();x.arc(px,py,r,0,7);x.stroke()}
  else{const p=f.p;if(!p.sx)continue;for(let j=0;j<2;j++){const u=(t*2+j*.5)%1;x.strokeStyle=C(.55*(1-u));x.beginPath();x.arc(p.sx,p.sy,6+u*34,0,7);x.stroke()}
    x.font=`400 12px ${FONT()}`;x.fillStyle=C(Math.min(1,t*4)*(1-Math.max(0,t-.85)/.15));x.fillText(nm(p),p.sx+14,p.sy-10);x.font=`italic 400 11px ${FONT()}`;x.fillStyle=MU(1-Math.max(0,t-.85)/.15);x.fillText(p.c||'',p.sx+14,p.sy+4)}}}

/* ---------- L4 · the cabinet ---------- */
const SORTS={
  year:{n:'Year',ends:['Newer','Older'],groups:()=>CENT.map((c,i)=>({n:c,f:p=>p.cen===i})),inner:(a,b)=>hard(a)-hard(b),sub:p=>'Mohs '+hard(p)},
  hard:{n:'Hardness',ends:['Soft','Hard'],groups:()=>[[1,3,'1–3'],[3,4,'3–4'],[4,5,'4–5'],[5,6,'5–6'],[6,7,'6–7'],[7,11,'7–10']].map(([a,b,n])=>({n:'Mohs '+n,f:p=>hard(p)>=a&&hard(p)<b})),inner:(a,b)=>year(a)-year(b),sub:p=>'named '+year(p)},
  kind:{n:'Class',ends:null,groups:()=>[...MWORDS,'other'].map(w=>({n:w,f:p=>mword(p)===w})),inner:(a,b)=>year(a)-year(b),sub:p=>p.id},
  sys:{n:'Crystal',ends:null,groups:()=>Object.keys(SYS).map(s=>({n:s,f:p=>p.id===s})),inner:(a,b)=>hard(a)-hard(b),sub:p=>'Mohs '+hard(p)}};
let sortK='year',cabOn=false,cabK=0,od=0,odS=0,cabHover=null,cabHoverD=null,G=[];const opn=[];
const cr={x:.26,y:.5,tx:.26,ty:.5};
const cabEl=document.getElementById('cab'),sortEl=document.getElementById('sort');
function items(){return P.filter(p=>COL.includes(nm(p)))}
function regroup(){const S=SORTS[sortK],its=items();G=S.groups().map(g=>({n:g.n,its:its.filter(g.f).sort(S.inner)}));
  if(!G[od]||!G[od].its.length)od=Math.max(0,G.findIndex(g=>g.its.length));while(opn.length<G.length)opn.push(0)}
function renderCab(){if(!COL)return;cabEl.querySelector('.n').innerHTML=`<i class="fr"></i>×${COL.length}`;cabEl.classList.toggle('on',cabOn);
  sortEl.innerHTML=Object.entries(SORTS).map(([k,s])=>`<button data-k="${k}" class="${k===sortK?'on':''}">${s.n}</button>`).join('<span>·</span>');
  sortEl.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();sortK=b.dataset.k;regroup();renderCab()})}
function setCab(on){if(on===cabOn)return;cabOn=on;if(on){if(focus)unfocus();regroup()}document.body.classList.toggle('cab',on);parent.postMessage({t:'cab',on},'*');renderCab()}
cabEl.onclick=e=>{e.stopPropagation();setCab(!cabOn)};
function openSpecimen(p){setCab(false);const h=hemiOf(p);
  if(level===0){setHemi(h);setTimeout(()=>{goIn(p.cen);setTimeout(()=>setFocus(p),900)},turnT<1?1700:80)}
  else{if(!inHemi(p,hemi))setHemi(h);depthT=p.cen;renderSide();setTimeout(()=>setFocus(p),550)}}
let crects=[],fronts=[];
function drawCab(now){cabK+=((cabOn?1:0)-cabK)*.09;if(cabK<.01)return;regroup();
  const u=Math.min(LW,LH)*.24,n=G.length,dh=Math.min(.36*u,2.3*u/n),Hh=dh*n,X0=1.45*u,Z0=.5*u,cx=LW/2,cy=LH/2+10,k=ease(cabK);
  cr.x+=(cr.tx-cr.x)*.08;cr.y+=(cr.ty-cr.y)*.08;odS+=(od-odS)*.12;
  const t=now/1000,r={x:cr.x+Math.sin(t/2.7)*.012,y:cr.y+Math.sin(t/3.4)*.02};   // the same slow float as the world
  const pj=v=>W3(v,r,cx,cy+(1-k)*40,2200);const seg=(a,b,al,dash)=>{const A=pj(a),B=pj(b);x.setLineDash(dash||[]);x.strokeStyle=C(al*k);x.beginPath();x.moveTo(A[0],A[1]);x.lineTo(B[0],B[1]);x.stroke();x.setLineDash([])};
  const box=(x0,x1,y0,y1,z0,z1,al,dash,front)=>{const c=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
    [[0,1],[1,2],[2,3],[3,0],[0,4],[1,5],[2,6],[3,7]].forEach(([i,j])=>seg(c[i],c[j],al*.6,dash));[[4,5],[5,6],[6,7],[7,4]].forEach(([i,j])=>seg(c[i],c[j],front?al:al*.6,dash));return [c[4],c[5],c[6],c[7]].map(pj)};
  x.lineWidth=1;
  // the carcass, and the sorting axis running through it
  box(-X0-.06*u,X0+.06*u,-Hh/2-.06*u,Hh/2+.06*u,-Z0-.04*u,Z0,.16);
  const ax0=[-X0-.32*u,-Hh/2-.55*u,0],ax1=[-X0-.32*u,Hh/2+.55*u,0];seg(ax0,ax1,.35);
  const S=SORTS[sortK];if(S.ends){const a=pj(ax0),b=pj(ax1);x.font=`italic 400 12px ${FONT()}`;x.fillStyle=MU(k);x.textAlign='center';x.fillText(S.ends[0],a[0],a[1]-8);x.fillText(S.ends[1],b[0],b[1]+16);x.textAlign='left'}
  crects=[];fronts=[];const lift=[];
  G.forEach((g,i)=>{opn[i]+=((i===od?1:0)-opn[i])*.1;const y0=-Hh/2+i*dh+.03*u,y1=y0+dh-.06*u,dz=opn[i]*.95*u,f=Math.max(.13,1-Math.abs(i-odS)*.3),empty=!g.its.length;
    const fr=box(-X0,X0,y0,y1,-Z0+dz,Z0+dz,(empty?.22:.42)*f+(cabHoverD===i?.25:0),empty?[2,3]:null,true);fronts.push([fr,i]);
    // a tick on the axis for this drawer, then its name and count, written on the front
    const tk=pj([-X0-.32*u,(y0+y1)/2,0]);x.fillStyle=C((i===od?1:.4)*k);x.beginPath();x.arc(tk[0],tk[1],i===od?2.6:1.6,0,7);x.fill();
    const lp=pj([X0+.12*u,(y0+y1)/2,Z0+dz]);const blur=FOCUS(i-odS);x.filter=blur>.05?`blur(${(blur*1.6).toFixed(2)}px)`:'none';
    x.font=`${i===od?'':'italic '}400 12px ${FONT()}`;x.fillStyle=i===od?C(k):MU((.45+.55*f)*k);x.fillText(g.n,lp[0],lp[1]+4);const w=x.measureText(g.n).width;
    x.font=`400 10px ${FONT()}`;x.fillStyle=MU(f*k);x.fillText(empty?'—':'×'+g.its.length,lp[0]+w+8,lp[1]+4);x.filter='none';
    // the specimens: a ring each while the drawer is shut, the pictures stand up when it is open
    const nj=g.its.length,sp=Math.min(.44*u,2.6*u/Math.max(1,nj));
    g.its.forEach((p,j)=>{const tx=(j-(nj-1)/2)*sp,ty=y1-.02*u,tz=dz+Z0*.1;p._cv=p._cv||{x:tx,y:ty,z:tz};const q=p._cv;q.x+=(tx-q.x)*.09;q.y+=(ty-q.y)*.09;q.z+=(tz-q.z)*.09;   // re-sorting: they fly to their new drawers
      const s=pj([q.x,q.y,q.z]),o=opn[i];
      if(o>.4&&p.im&&p.im.complete&&p.im.naturalWidth){const hh=Math.min(dh*1.5,sp*.95)*(.6+.4*o),ww=Math.min(hh*(p.ar||1),sp*.9),h2=ww/(p.ar||1);lift.push([p,s[0]-ww/2,s[1]-h2,ww,h2,o])}
      else{x.strokeStyle=C(.6*f*k);x.beginPath();x.arc(s[0],s[1]-4,2.6,0,7);x.stroke()}})});
  // the open drawer is drawn last: pictures, then a slip with the name and the note
  lift.forEach(([p,X,Y,w,h,o])=>{x.globalAlpha=k*Math.min(1,(o-.4)*2);x.drawImage(p.im,X,Y,w,h);crects.push([X,Y,w,h,p]);
    const hv=cabHover===p;if(hv){x.strokeStyle=C(.45);x.beginPath();x.arc(X+w/2,Y+h/2,Math.hypot(w,h)/2+7,0,7);x.stroke()}
    const n1=nm(p),n2=NOTES[n1]?'“'+NOTES[n1].slice(0,26)+(NOTES[n1].length>26?'…':'')+'”':SORTS[sortK].sub(p);x.font=`400 11px ${FONT()}`;const w1=x.measureText(n1).width;x.font=`italic 400 10px ${FONT()}`;const w2=x.measureText(n2).width;
    const bw=Math.max(w1,w2)+8;x.fillStyle=TH.bg;x.globalAlpha*=.9;x.fillRect(X+w/2-bw/2,Y+h+4,bw,28);x.globalAlpha=k*Math.min(1,(o-.4)*2);
    x.textAlign='center';x.font=`400 11px ${FONT()}`;x.fillStyle=C(1);x.fillText(n1,X+w/2,Y+h+16);x.font=`italic 400 10px ${FONT()}`;x.fillStyle=MU(1);x.fillText(n2,X+w/2,Y+h+29);x.textAlign='left';x.globalAlpha=1});
  if(!COL.length){x.font=`italic 400 13px ${FONT()}`;x.fillStyle=MU(k);x.textAlign='center';x.fillText('Nothing collected yet',cx,cy);x.textAlign='left'}}

/* cabinet input: it takes the pointer while it is open */
const inPoly=(px,py,q)=>{let c=false;for(let i=0,j=q.length-1;i<q.length;j=i++){const [xi,yi]=q[i],[xj,yj]=q[j];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)c=!c}return c};
function cabHit(e){for(let i=crects.length-1;i>=0;i--){const r=crects[i];if(e.clientX>=r[0]&&e.clientX<=r[0]+r[2]&&e.clientY>=r[1]&&e.clientY<=r[1]+r[3])return{p:r[4]}}
  for(let i=fronts.length-1;i>=0;i--)if(inPoly(e.clientX,e.clientY,fronts[i][0]))return{d:fronts[i][1]};return{}}
let drag=null,dx0=0,dy0=0,dm=0;
const own=e=>e.target.closest&&e.target.closest('#cab,#sort,#tools,#note');
addEventListener('pointerdown',e=>{if(own(e))return;
  if(cabOn){e.stopImmediatePropagation();drag='c';dx0=e.clientX;dy0=e.clientY;dm=0;return}
  if(focus&&e.target===cv){drag='x';dx0=e.clientX;dy0=e.clientY;dm=0}},true);
addEventListener('pointermove',e=>{if(cabOn){e.stopImmediatePropagation();
    if(drag==='c'){const ddx=e.clientX-dx0,ddy=e.clientY-dy0;dm+=Math.abs(ddx)+Math.abs(ddy);dx0=e.clientX;dy0=e.clientY;cr.ty=Math.max(-1.1,Math.min(1.1,cr.ty+ddx*.006));cr.tx=Math.max(-.5,Math.min(.9,cr.tx-ddy*.006));return}
    const h=cabHit(e);cabHover=h.p||null;cabHoverD=h.d??null;document.body.style.cursor=h.p||h.d!=null?'pointer':'grab';return}
  if(drag==='x'){const ddx=e.clientX-dx0,ddy=e.clientY-dy0;dm+=Math.abs(ddx)+Math.abs(ddy);dx0=e.clientX;dy0=e.clientY;if(dm>3){e.stopImmediatePropagation();rot.y+=ddx*.008;rot.x-=ddy*.008;rot.vy=ddx*.0006||rot.vy}}},true);
addEventListener('pointerup',e=>{if(cabOn){e.stopImmediatePropagation();if(drag==='c'&&dm<4){const h=cabHit(e);if(h.p)openSpecimen(h.p);else if(h.d!=null&&G[h.d].its.length)od=h.d}drag=null;return}
  if(drag==='x'){if(dm>3){e.stopImmediatePropagation();down=null}if(Math.abs(rot.vy)<.0008)rot.vy=.0022*Math.sign(rot.vy||1);drag=null}},true);
addEventListener('wheel',e=>{if(!cabOn)return;e.stopImmediatePropagation();e.preventDefault();const n=Date.now();if(n-(drawCab.w||0)<170||Math.abs(e.deltaY)<4)return;drawCab.w=n;
  const d=e.deltaY>0?1:-1;let i=od+d;while(G[i]&&!G[i].its.length)i+=d;if(G[i])od=i},{capture:true,passive:false});
addEventListener('dblclick',e=>{if(cabOn){e.stopImmediatePropagation();cr.tx=.26;cr.ty=.5}},true);
addEventListener('keydown',e=>{if(e.target===note)return;
  if(e.key==='c'||e.key==='C'){setCab(!cabOn);return}
  if(!cabOn)return;e.stopImmediatePropagation();if(e.key==='Escape')setCab(false);
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){const d=e.key==='ArrowDown'?1:-1;let i=od+d;while(G[i]&&!G[i].its.length)i+=d;if(G[i])od=i}},true);
addEventListener('message',e=>{if((e.data||{}).t==='cab')setCab(!!e.data.on)});

/* ---------- loop ---------- */
(function boot(){if(!P.length||!P[0].im){setTimeout(boot,200);return}
  if(!COL){const seen={};COL=[];P.forEach(p=>{const w=mword(p);if(!seen[w]&&COL.length<8){seen[w]=1;COL.push(nm(p))}});store.set('col',COL)}   // a few to start the cabinet with: one of each kind
  renderCab();
  (function loop(now){x.clearRect(0,0,LW,LH);if(!cabOn&&focus)drawSpecimen(now);drawFX(now);drawCab(now);requestAnimationFrame(loop)})(performance.now())})();
})();
