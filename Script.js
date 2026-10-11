let DB=JSON.parse(localStorage.getItem('vocabmaster_v1')||'[]');
let DICTCACHE=JSON.parse(localStorage.getItem('vocab_dict_cache')||'{}');
function save(){localStorage.setItem('vocabmaster_v1',JSON.stringify(DB));renderList();}
function saveCache(){localStorage.setItem('vocab_dict_cache',JSON.stringify(DICTCACHE));}
function showTab(t){document.querySelectorAll('.tab').forEach(e=>e.classList.remove('active'));document.querySelectorAll('nav button').forEach(e=>e.classList.remove('active'));document.getElementById('tab-'+t).classList.add('active');document.getElementById('btn-'+t).classList.add('active');if(t==='list')renderList();if(t==='review')renderStats();}
async function addWord(){let w=document.getElementById('inp-word').value.trim().toLowerCase();let m=document.getElementById('inp-meaning').value.trim();if(!w||!m){alert('هم کلمه هم معنی');return;}if(!DB.find(x=>x.word===w)){DB.push({word:w,meaning:m,level:0,interval:1,ease:2.5,nextReview:Date.now()});save();}await learnWord(w,m);}
async function fetchDict(word){if(DICTCACHE[word])return DICTCACHE[word];try{let r=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+word);if(!r.ok)return null;let j=await r.json();DICTCACHE[word]=j;saveCache();return j;}catch(e){return null;}}
function guessLevel(word,data){let len=word.length;let pos=data&&data[0]?data[0].meanings[0].partOfSpeech:'';if(len<=4)return 'A1 مبتدی';if(len<=6)return 'A2 پایه';if(len<=8)return 'B1 متوسط';if(len<=10)return 'B2 پیشرفته';return 'C1/C2 آکادمیک';}
async function learnWord(word,myMeaning){
let box=document.getElementById('learn-result');box.innerHTML='<div class="card">⏳...</div>';
let data=await fetchDict(word);let phon='',audio='',defs='',ex='',syn='',ant='';
if(data&&data[0]){phon=data[0].phonetic||'';let a=data[0].phonetics.find(p=>p.audio);audio=a?a.audio:'';data[0].meanings.slice(0,3).forEach(mean=>{defs+='<div class="def"><span class="badge pos">'+mean.partOfSpeech+'</span>';mean.definitions.slice(0,2).forEach((d,i)=>{defs+='<p><b>'+(i+1)+'.</b> '+d.definition+'</p>';if(d.example){defs+='<p class="example">Ex: '+d.example+'</p>';if(!ex)ex=d.example;}if(d.synonyms&&d.synonyms.length&&!syn)syn=d.synonyms.slice(0,5).join(', ');if(d.antonyms&&d.antonyms.length&&!ant)ant=d.antonyms.slice(0,5).join(', ');});defs+='</div>';});}
if(!ex)ex='I learned '+word+' today.';let lvl=guessLevel(word,data);
box.innerHTML='<div class="card"><h2>'+word+' <span class="phon">'+phon+'</span></h2><p><span class="badge level">سطح '+lvl+'</span> <span class="badge">معنی تو: '+myMeaning+'</span></p><div class="row">'
+(audio?'<button onclick="playAudio(\''+audio+'\')">🔊 تلفظ</button>':'')+'<button onclick="speak(\''+word+'\')">🗣️ آفلاین</button></div><h3>📖 دایره لغات دیکشنری</h3>'+(defs||'پیدا نشد')
+(syn?'<p>🔗 مترادف: '+syn+'</p>':'')+(ant?'<p>⚡ متضاد: '+ant+'</p>':'')
+'<h3>🎬 فیلم و سریال (بدون فیلتر / با فیلتر)</h3><div class="row"><a href="https://www.aparat.com/result/search?q='+word+'" target="_blank"><button>آپارات بدون فیلتر</button></a><a href="https://playphrase.me/en/search?q='+word+'" target="_blank"><button>تیکه سریال PlayPhrase</button></a><a href="https://youglish.com/pronounce/'+word+'/english" target="_blank"><button>YouGlish با فیلترشکن</button></a></div>'
+'<h3>💡 جمله طلایی</h3><p class="def">'+ex+'</p></div>';
}
function playAudio(u){new Audio(u).play();}function speak(t){let u=new SpeechSynthesisUtterance(t);u.lang='en-US';speechSynthesis.speak(u);}
function dueWords(){return DB.filter(w=>w.nextReview<=Date.now());}
function renderStats(){document.getElementById('review-stats').innerHTML='📦 کل: '+DB.length+' | ⏰ امروز: '+dueWords().length;}
function renderList(){let el=document.getElementById('word-list');if(!DB.length){el.innerHTML='خالیه';return;}el.innerHTML=DB.map(w=>'<div class="def"><b>'+w.word+'</b> = '+w.meaning+' <button onclick="learnWord(\''+w.word+'\',\''+w.meaning+'\')">آموزش</button> <button onclick="delWord(\''+w.word+'\')">حذف</button></div>').join('');}
function delWord(w){DB=DB.filter(x=>x.word!==w);save();}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));let t=a[i];a[i]=a[j];a[j]=t;}return a;}
let quizQueue=[],quizIndex=0,quizMode='mixed',score=0;
function startQuiz(mode){if(DB.length<2){alert('حداقل ۲ لغت');return;}quizMode=mode;quizQueue=shuffle([...DB]).slice(0,10);quizIndex=0;score=0;nextQ();}
function getD(c,f){return shuffle(DB.filter(w=>w.word!==c.word)).slice(0,3).map(o=>o[f]);}
function nextQ(){renderStats();let box=document.getElementById('quiz-box');if(quizIndex>=quizQueue.length){box.innerHTML='<h2>🎉 تمام! امتیاز '+score+' از '+quizQueue.length+'</h2>';return;}let w=quizQueue[quizIndex];let types=['en-fa','fa-en','blank','image'];let type=quizMode==='mixed'?types[Math.floor(Math.random()*types.length)]:quizMode;
if(type==='listening'){box.innerHTML='<p>گوش بده و تایپ کن</p><div class="row"><button onclick="speak(\''+w.word+'\')">پخش</button></div><div class="row"><input id="listen-inp"><button onclick="checkListening(\''+w.word+'\')">ثبت</button></div>';speak(w.word);return;}
if(type==='image'){let img='https://loremflickr.com/600/350/'+encodeURIComponent(w.word);let opts=shuffle([w.word,...getD(w,'word')]);box.innerHTML='<p>سوال '+(quizIndex+1)+' - این عکس چیه؟</p><img class="quiz-img" src="'+img+'" onerror="this.src=\'https://picsum.photos/seed/'+w.word+'/600/350\'"><div class="quiz-q">🖼️ به انگلیسی چی میشه؟</div>'+opts.map(o=>'<button class="opt" onclick="answer(this,\''+o+'\',\''+w.word+'\',\''+w.word+'\')">'+o+'</button>').join('');return;}
if(type==='en-fa'){let opts=shuffle([w.meaning,...getD(w,'meaning')]);box.innerHTML='<div class="quiz-q">'+w.word+' یعنی چی؟</div>'+opts.map(o=>'<button class="opt" onclick="answer(this,\''+o+'\',\''+w.meaning+'\',\''+w.word+'\')">'+o+'</button>').join('');}
else if(type==='fa-en'){let opts=shuffle([w.word,...getD(w,'word')]);box.innerHTML='<div class="quiz-q">'+w.meaning+' به انگلیسی؟</div>'+opts.map(o=>'<button class="opt" onclick="answer(this,\''+o+'\',\''+w.word+'\',\''+w.word+'\')">'+o+'</button>').join('');}
else{box.innerHTML='<div id="blank-q">...</div>';fetchDict(w.word).then(d=>{let e2=d&&d[0]&&d[0].meanings[0].definitions.find(x=>x.example);let sent=e2?e2.example:'I learned '+w.word;let masked=sent.replace(new RegExp(w.word,'ig'),'_____');let opts=shuffle([w.word,...getD(w,'word')]);document.getElementById('blank-q').innerHTML='<p class="def">'+masked+'</p>'+opts.map(o=>'<button class="opt" onclick="answer(this,\''+o+'\',\''+w.word+'\',\''+w.word+'\')">'+o+'</button>').join('');});}}
function checkListening(c){let v=document.getElementById('listen-inp').value.trim().toLowerCase();if(v===c){score++;updateSM2(c,true);}else{updateSM2(c,false);alert('درست: '+c);}quizIndex++;nextQ();}
function answer(btn,val,correct,word){document.querySelectorAll('.opt').forEach(b=>{if(b.textContent===correct)b.classList.add('correct');});if(val===correct){score++;updateSM2(word,true);}else{btn.classList.add('wrong');updateSM2(word,false);}setTimeout(()=>{quizIndex++;nextQ();},800);}
function updateSM2(word,ok){let w=DB.find(x=>x.word===word);if(!w)return;if(ok){w.level++;w.interval=w.level===1?1:w.level===2?3:Math.round(w.interval*w.ease);}else{w.level=0;w.interval=1;}w.nextReview=Date.now()+w.interval*24*3600*1000;save();renderStats();}
renderList();