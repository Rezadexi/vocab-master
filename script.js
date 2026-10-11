let DB = JSON.parse(localStorage.getItem('vocabmaster_v1')||'[]');
function save(){localStorage.setItem('vocabmaster_v1',JSON.stringify(DB));renderList();}
function showTab(t){
document.querySelectorAll('.tab').forEach(e=>e.classList.remove('active'));
document.querySelectorAll('nav button').forEach(e=>e.classList.remove('active'));
document.getElementById('tab-'+t).classList.add('active');
document.getElementById('btn-'+t).classList.add('active');
if(t==='list')renderList();
if(t==='review')renderStats();
}
async function addWord(){
let w=document.getElementById('inp-word').value.trim().toLowerCase();
let m=document.getElementById('inp-meaning').value.trim();
if(!w||!m){alert('هم کلمه هم معنی را بنویس');return;}
if(!DB.find(x=>x.word===w)){DB.push({word:w,meaning:m,level:0,interval:1,ease:2.5,nextReview:Date.now()});save();}
await learnWord(w,m);
}
async function fetchDict(word){
try{let r=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+word);if(!r.ok)return null;return await r.json();}catch(e){return null;}
}
async function learnWord(word,myMeaning){
let box=document.getElementById('learn-result');
box.innerHTML='<div class="card">در حال دریافت معنی و تلفظ...</div>';
let data=await fetchDict(word);
let phon='',audio='',defs='',ex='';
if(data&&data[0]){
phon=data[0].phonetic||'';
let a=data[0].phonetics.find(p=>p.audio);audio=a?a.audio:'';
data[0].meanings.slice(0,3).forEach(mean=>{
defs+='<div class="def"><span class="badge">'+mean.partOfSpeech+'</span>';
mean.definitions.slice(0,3).forEach((d,i)=>{defs+='<p><b>'+(i+1)+'.</b> '+d.definition+'</p>';if(d.example){defs+='<p class="example">Ex: '+d.example+'</p>';if(!ex)ex=d.example;}});
defs+='</div>';
});
}
if(!ex)ex='I learned the word '+word+' today.';
box.innerHTML='<div class="card"><h2>'+word+' <span class="phon">'+phon+'</span></h2><p>معنی تو: <b>'+myMeaning+'</b></p><div class="row">'
+(audio?'<button onclick="playAudio(\''+audio+'\')">پخش تلفظ</button>':'')
+'<button onclick="speak(\''+word+'\')">تلفظ آفلاین</button></div><h3>دایره معانی</h3>'+(defs||'پیدا نشد')+'<h3>کلیپ واقعی</h3><div class="row"><a href="https://youglish.com/pronounce/'+word+'/english" target="_blank"><button>دیدن در YouGlish</button></a><a href="https://playphrase.me/en/search?q='+word+'" target="_blank"><button>دیدن در PlayPhrase</button></a></div><div class="video-box"><iframe src="https://youglish.com/embed/english/'+word+'"></iframe></div><h3>جمله طلایی</h3><p class="def">'+ex+'</p></div>';
}
function playAudio(u){new Audio(u).play();}
function speak(t){let u=new SpeechSynthesisUtterance(t);u.lang='en-US';speechSynthesis.speak(u);}
function dueWords(){return DB.filter(w=>w.nextReview<=Date.now());}
function renderStats(){let d=dueWords().length;document.getElementById('review-stats').innerHTML='کل: '+DB.length+' | مرور امروز: '+d;}
function renderList(){let el=document.getElementById('word-list');if(!DB.length){el.innerHTML='هنوز لغتی نداری.';return;}el.innerHTML=DB.map(w=>'<div class="def"><b>'+w.word+'</b> = '+w.meaning+' <button onclick="learnWord(\''+w.word+'\',\''+w.meaning+'\')">آموزش</button> <button onclick="delWord(\''+w.word+'\')">حذف</button></div>').join('');}
function delWord(w){DB=DB.filter(x=>x.word!==w);save();}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));let t=a[i];a[i]=a[j];a[j]=t;}return a;}
let quizQueue=[],quizIndex=0,quizMode='mixed',score=0;
function startQuiz(mode){if(DB.length<2){alert('حداقل ۲ لغت اضافه کن');return;}quizMode=mode;quizQueue=shuffle([...DB]).slice(0,10);quizIndex=0;score=0;nextQ();}
function getD(c,f){return shuffle(DB.filter(w=>w.word!==c.word)).slice(0,3).map(o=>o[f]);}
function nextQ(){
renderStats();let box=document.getElementById('quiz-box');
if(quizIndex>=quizQueue.length){box.innerHTML='<h2>تمام شد! امتیاز: '+score+'</h2>';return;}
let w=quizQueue[quizIndex];let types=['en-fa','fa-en','blank'];let type=quizMode==='mixed'?types[Math.floor(Math.random()*types.length)]:quizMode;
if(type==='listening'){box.innerHTML='<p>گوش بده و تایپ کن</p><div class="row"><button onclick="speak(\''+w.word+'\')">پخش</button></div><div class="row"><input id="listen-inp" placeholder="تایپ کن..."><button onclick="checkListening(\''+w.word+'\')">ثبت</button></div>';speak(w.word);return;}
if(type==='en-fa'){let opts=shuffle([w.meaning,...getD(w,'meaning')]);box.innerHTML='<div class="quiz-q">'+w.word+' یعنی چی؟</div>'+opts.map(o=>'<button class="opt" onclick="answer(this,\''+o+'\',\''+w.meaning+'\',\''+w.word+'\')">'+o+'</button>').join('');}
else if(type==='fa-en'){let opts=shuffle([w.word,...getD(w,'word')]);box.innerHTML='<div class="quiz-q">'+w.meaning+' به انگلیسی؟</div>'+opts.map(o=>'<button class="opt" onclick="answer(this,\''+o+'\',\''+w.word+'\',\''+w.word+'\')">'+o+'</button>').join('');}
else{box.innerHTML='<div id="blank-q">در حال ساخت جمله...</div>';fetchDict(w.word).then(d=>{let e2=d&&d[0]&&d[0].meanings[0].definitions.find(x=>x.example);let sent=e2?e2.example:'I learned '+w.word+' today.';let masked=sent.replace(new RegExp(w.word,'ig'),'_____');let opts=shuffle([w.word,...getD(w,'word')]);document.getElementById('blank-q').innerHTML='<p class="def">'+masked+'</p>'+opts.map(o=>'<button class="opt" onclick="answer(this,\''+o+'\',\''+w.word+'\',\''+w.word+'\')">'+o+'</button>').join('');});}
}
function checkListening(c){let v=document.getElementById('listen-inp').value.trim().toLowerCase();if(v===c){score++;updateSM2(c,true);alert('درست بود');}else{updateSM2(c,false);alert('درستش: '+c);}quizIndex++;nextQ();}
function answer(btn,val,correct,word){let all=document.querySelectorAll('.opt');all.forEach(b=>{if(b.textContent===correct)b.classList.add('correct');});if(val===correct){score++;updateSM2(word,true);}else{btn.classList.add('wrong');updateSM2(word,false);}setTimeout(()=>{quizIndex++;nextQ();},800);}
function updateSM2(word,ok){let w=DB.find(x=>x.word===word);if(!w)return;if(ok){w.level++;w.interval=w.level===1?1:w.level===2?3:Math.round(w.interval*w.ease);}else{w.level=0;w.interval=1;}w.nextReview=Date.now()+w.interval*24*3600*1000;save();renderStats();}
renderList();