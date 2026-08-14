/* AlDana Al-Dosari - MSc AI ePortfolio - shared script */
(function(){
  var bar=document.getElementById('progress');
  function onScroll(){
    var h=document.documentElement,max=h.scrollHeight-h.clientHeight;
    if(bar) bar.style.transform='scaleX('+(max>0?h.scrollTop/max:0)+')';
  }
  onScroll(); window.addEventListener('scroll',onScroll,{passive:true});

  /* margin notes */
  document.querySelectorAll('.mark').forEach(function(btn){
    btn.addEventListener('click',function(){
      var note=document.getElementById(btn.dataset.note);
      var anchor=btn.dataset.anchor?document.getElementById(btn.dataset.anchor):null;
      var open=btn.getAttribute('aria-expanded')==='true';
      btn.setAttribute('aria-expanded',String(!open));
      if(note) note.classList.toggle('is-open',!open);
      if(anchor) anchor.classList.toggle('is-lit',!open);
    });
  });

  /* home: highlight the menu item for the section in view */
  var links={};
  document.querySelectorAll('.topbar nav a[data-spy]').forEach(function(a){
    links[a.getAttribute('href').replace(/^.*#/,'')]=a;
  });
  if(Object.keys(links).length){
    var spy=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var a=links[e.target.id]; if(!a) return;
        if(e.isIntersecting){
          Object.keys(links).forEach(function(k){links[k].removeAttribute('aria-current');});
          a.setAttribute('aria-current','true');
        }
      });
    },{rootMargin:'-25% 0px -60% 0px'});
    document.querySelectorAll('section[id]').forEach(function(s){spy.observe(s);});
  }

  /* module pages: section switcher */
  var tabs=Array.prototype.slice.call(document.querySelectorAll('.tabs button'));
  if(tabs.length){
    function show(id,push){
      tabs.forEach(function(t){
        var on=t.dataset.panel===id;
        t.setAttribute('aria-selected',String(on));
        t.tabIndex=on?0:-1;
        var p=document.getElementById(t.dataset.panel);
        if(p) p.hidden=!on;
      });
      if(push && history.replaceState) history.replaceState(null,'','#'+id);
    }
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){show(t.dataset.panel,true);});
      t.addEventListener('keydown',function(e){
        var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;
        if(!d) return;
        e.preventDefault();
        var n=tabs[(i+d+tabs.length)%tabs.length];
        n.focus(); show(n.dataset.panel,true);
      });
    });
    var start=location.hash.slice(1);
    show(tabs.some(function(t){return t.dataset.panel===start;})?start:tabs[0].dataset.panel,false);
  }
})();
