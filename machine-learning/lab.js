/* Correlation & Regression Lab: the Unit 3 notebooks, computed in the browser */
(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var NS="http://www.w3.org/2000/svg";

/* ---------- maths ---------- */
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function normalGen(seed){var r=mulberry(seed),spare=null;return function(){
  if(spare!==null){var s=spare;spare=null;return s;}
  var u=0,v=0;while(u===0)u=r();v=r();var m=Math.sqrt(-2*Math.log(u));
  spare=m*Math.sin(2*Math.PI*v);return m*Math.cos(2*Math.PI*v);};}
function mean(a){var s=0;for(var i=0;i<a.length;i++)s+=a[i];return s/a.length;}
function stdPop(a){var m=mean(a),s=0;for(var i=0;i<a.length;i++)s+=(a[i]-m)*(a[i]-m);return Math.sqrt(s/a.length);}
function covS(a,b){var ma=mean(a),mb=mean(b),s=0;for(var i=0;i<a.length;i++)s+=(a[i]-ma)*(b[i]-mb);return s/(a.length-1);}
function pearson(a,b){var ma=mean(a),mb=mean(b),sab=0,saa=0,sbb=0;
  for(var i=0;i<a.length;i++){var da=a[i]-ma,db=b[i]-mb;sab+=da*db;saa+=da*da;sbb+=db*db;}
  return (saa===0||sbb===0)?NaN:sab/Math.sqrt(saa*sbb);}
function lgamma(x){var c=[76.18009172947146,-86.50532032941677,24.01409824083091,
  -1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
  var y=x,t=x+5.5;t-=(x+0.5)*Math.log(t);var s=1.000000000190015;
  for(var j=0;j<6;j++)s+=c[j]/++y;return -t+Math.log(2.5066282746310005*s/x);}
function betacf(a,b,x){var qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<1e-30)d=1e-30;
  d=1/d;var h=d;for(var m=1;m<=200;m++){var m2=2*m,aa=m*(b-m)*x/((qam+m2)*(a+m2));
  d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;h*=d*c;
  aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;
  c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;var del=d*c;h*=del;if(Math.abs(del-1)<3e-12)break;}return h;}
function ibeta(a,b,x){if(x<=0)return 0;if(x>=1)return 1;
  var bt=Math.exp(lgamma(a+b)-lgamma(a)-lgamma(b)+a*Math.log(x)+b*Math.log(1-x));
  return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b;}
function pTwoSided(t,df){if(!isFinite(t))return 0;return ibeta(df/2,0.5,df/(df+t*t));}
function linregress(x,y){var n=x.length,mx=mean(x),my=mean(y),sxx=0,sxy=0;
  for(var i=0;i<n;i++){sxx+=(x[i]-mx)*(x[i]-mx);sxy+=(x[i]-mx)*(y[i]-my);}
  var slope=sxy/sxx,intercept=my-slope*mx,r=pearson(x,y);
  var df=n-2,t=r*Math.sqrt(df/Math.max(1e-300,1-r*r));
  return {slope:slope,intercept:intercept,r:r,p:df>0?pTwoSided(t,df):NaN};}
function solve(A,b){var n=b.length,M=A.map(function(r,i){return r.concat([b[i]]);});
  for(var c=0;c<n;c++){var p=c;for(var r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;
    var tmp=M[c];M[c]=M[p];M[p]=tmp;if(Math.abs(M[c][c])<1e-14)return null;
    for(var r2=c+1;r2<n;r2++){var f=M[r2][c]/M[c][c];for(var k=c;k<=n;k++)M[r2][k]-=f*M[c][k];}}
  var x=new Array(n);for(var i=n-1;i>=0;i--){var s=M[i][n];for(var j=i+1;j<n;j++)s-=M[i][j]*x[j];x[i]=s/M[i][i];}return x;}
function ols(rows,y){/* rows: arrays of predictors; returns [intercept, b1, b2...] */
  var k=rows[0].length+1,A=[],b=[];for(var i=0;i<k;i++){A.push(new Array(k).fill(0));b.push(0);}
  rows.forEach(function(r,n){var v=[1].concat(r);for(var i=0;i<k;i++){b[i]+=v[i]*y[n];
    for(var j=0;j<k;j++)A[i][j]+=v[i]*v[j];}});return solve(A,b);}
function r2(y,yh){var m=mean(y),ss=0,sr=0;for(var i=0;i<y.length;i++){ss+=(y[i]-m)*(y[i]-m);sr+=(y[i]-yh[i])*(y[i]-yh[i]);}return 1-sr/ss;}
function polyfit(x,y,d){if(x.length<=d)return null;var c=11.5,s=10.5;
  var rows=x.map(function(v){var u=(v-c)/s,r=[];for(var p=1;p<=d;p++)r.push(Math.pow(u,p));return r;});
  var w=ols(rows,y);if(!w)return null;
  return function(v){var u=(v-c)/s,o=w[0];for(var p=1;p<=d;p++)o+=w[p]*Math.pow(u,p);return o;};}
function f3(v){return isFinite(v)?v.toFixed(3):"nan";}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}

/* ---------- plotting ---------- */
var W=620,H=360,ML=52,MR=16,MT=14,MB=40;
function nice(lo,hi,n){var span=hi-lo||1,step=Math.pow(10,Math.floor(Math.log10(span/n))),e=span/n/step;
  step*=e>=5?10:e>=2?5:e>=1.5?2:1;var t=[],v=Math.ceil(lo/step)*step;for(;v<=hi+1e-9;v+=step)t.push(+v.toPrecision(10));return t;}
function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function plot(host,o){
  host.innerHTML="";var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":o.label||"plot"},host);
  var X=function(v){return ML+(v-o.xr[0])/(o.xr[1]-o.xr[0])*(W-ML-MR);},
      Y=function(v){return H-MB-(v-o.yr[0])/(o.yr[1]-o.yr[0])*(H-MT-MB);};
  var cp=el("clipPath",{id:host.id+"-clip"},svg);el("rect",{x:ML,y:MT,width:W-ML-MR,height:H-MT-MB},cp);
  nice(o.xr[0],o.xr[1],7).forEach(function(t){el("line",{class:"grid",x1:X(t),x2:X(t),y1:MT,y2:H-MB},svg);
    el("text",{class:"tick",x:X(t),y:H-MB+16,"text-anchor":"middle"},svg).textContent=fmtTick(t);});
  nice(o.yr[0],o.yr[1],6).forEach(function(t){el("line",{class:"grid",x1:ML,x2:W-MR,y1:Y(t),y2:Y(t)},svg);
    el("text",{class:"tick",x:ML-7,y:Y(t)+4,"text-anchor":"end"},svg).textContent=fmtTick(t);});
  el("line",{class:"ax",x1:ML,x2:W-MR,y1:H-MB,y2:H-MB},svg);el("line",{class:"ax",x1:ML,x2:ML,y1:MT,y2:H-MB},svg);
  el("text",{class:"lbl",x:(ML+W-MR)/2,y:H-6,"text-anchor":"middle"},svg).textContent=o.xl;
  var yl=el("text",{class:"lbl",x:14,y:(MT+H-MB)/2,"text-anchor":"middle",transform:"rotate(-90 14 "+((MT+H-MB)/2)+")"},svg);yl.textContent=o.yl;
  var g=el("g",{"clip-path":"url(#"+host.id+"-clip)"},svg);
  (o.bands||[]).forEach(function(b){el("rect",{class:"band",x:X(b[0]),y:MT,width:Math.max(0,X(b[1])-X(b[0])),height:H-MT-MB},g);
    if(b[2])el("text",{class:"cap",x:X(b[0])+6,y:MT+14},g).textContent=b[2];});
  (o.lines||[]).forEach(function(L){el("path",{class:L.cls||"fit",d:L.pts.map(function(p,i){return(i?"L":"M")+X(p[0]).toFixed(1)+" "+Y(p[1]).toFixed(1);}).join("")},g);});
  var rad=o.pts.length>200?2.4:o.pts.length>40?3.6:5.5;
  o.pts.forEach(function(p,i){var c=el("circle",{class:"pt"+(o.pts.length<=40?" big":""),cx:X(p[0]),cy:Y(p[1]),r:rad},g);c.dataset.i=i;});
  (o.hot||[]).forEach(function(p){el("circle",{class:"pt hot",cx:X(p[0]),cy:Y(p[1]),r:6.5},g);});
  if(o.onClick){svg.addEventListener("click",function(e){var pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
    var q=pt.matrixTransform(svg.getScreenCTM().inverse());
    if(e.target.dataset&&e.target.dataset.i!==undefined){o.onClick({remove:+e.target.dataset.i});return;}
    if(q.x<ML||q.x>W-MR||q.y<MT||q.y>H-MB)return;
    o.onClick({x:o.xr[0]+(q.x-ML)/(W-ML-MR)*(o.xr[1]-o.xr[0]),y:o.yr[0]+(H-MB-q.y)/(H-MT-MB)*(o.yr[1]-o.yr[0])});});}
}
function fmtTick(t){var a=Math.abs(t);return a>=10000?(t/1000)+"k":String(t);}
function range(a,pad){var lo=Math.min.apply(null,a),hi=Math.max.apply(null,a),p=(hi-lo||1)*(pad||.08);return[lo-p,hi+p];}

/* ---------- tabs ---------- */
var tabs=[].slice.call(document.querySelectorAll(".lab-tabs button"));
function showTab(t){tabs.forEach(function(b){var on=b===t;b.setAttribute("aria-selected",String(on));b.tabIndex=on?0:-1;
  $(b.getAttribute("aria-controls")).hidden=!on;});$("lab-title").textContent=t.dataset.file;}
tabs.forEach(function(t,i){t.addEventListener("click",function(){showTab(t);});
  t.addEventListener("keydown",function(e){var d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;if(!d)return;
    e.preventDefault();var n=tabs[(i+d+tabs.length)%tabs.length];n.focus();showTab(n);});});

/* ================= Ex 1 ================= */
var NS1=[5,10,20,30,50,100,300,1000],e1seed=1;
function e1(){
  var n=NS1[+$("e1-n").value],noise=+$("e1-noise").value,shape=$("e1-shape").value,k=+$("e1-scale").value,out=$("e1-out").checked;
  $("e1-n-o").textContent=n;$("e1-noise-o").textContent=noise;
  var g=normalGen(e1seed*7919+n),d1=[],d2=[];
  for(var i=0;i<n;i++)d1.push(20*g()+100);
  for(i=0;i<n;i++){var e=g();d2.push(shape==="pos"?d1[i]+(noise*e+50):shape==="neg"?-d1[i]+(noise*e+250):
    shape==="u"?Math.pow(d1[i]-100,2)/8+noise*e+60:noise*e+150);}
  if(out){d1.push(200);d2.push(shape==="neg"?300:0);}
  d1=d1.map(function(v){return v*k;});
  var r=pearson(d1,d2),c=covS(d1,d2);
  plot($("e1-plot"),{xr:range(d1),yr:range(d2),xl:"data1"+(k>1?" (× "+k+")":""),yl:"data2",
    pts:d1.map(function(v,i){return[v,d2[i]];}),hot:out?[[d1[d1.length-1],d2[d2.length-1]]]:[],label:"Scatter of data1 against data2"});
  var rel={pos:"data1 + (<b>"+noise+"</b> * randn(<b>"+n+"</b>) + 50)",neg:"<b>-data1</b> + (<b>"+noise+"</b> * randn(<b>"+n+"</b>) + 250)",
    u:"<b>(data1 - 100)**2 / 8</b> + <b>"+noise+"</b> * randn(<b>"+n+"</b>) + 60",none:"<b>"+noise+"</b> * randn(<b>"+n+"</b>) + 150"}[shape];
  $("e1-code").innerHTML="seed("+e1seed+")\ndata1 = "+(k>1?"<b>"+k+"</b> * (":"")+"20 * randn(<b>"+n+"</b>) + 100"+(k>1?")":"")+
    "\ndata2 = "+rel+(out?"\n<b>data1, data2 = append(data1, "+(200*k)+"), append(data2, "+(shape==="neg"?300:0)+")</b>":"")+
    "\ncovariance = cov(data1, data2)\ncorr, _ = pearsonr(data1, data2)";
  $("e1-out-txt").textContent="data1: mean="+f3(mean(d1))+" stdv="+f3(stdPop(d1))+"\ndata2: mean="+f3(mean(d2))+" stdv="+f3(stdPop(d2))+
    "\nCovariance: "+f3(c)+"\nPearsons correlation: "+f3(r);
}
["e1-n","e1-noise","e1-shape","e1-scale","e1-out"].forEach(function(id){$(id).addEventListener("input",e1);});
$("e1-new").addEventListener("click",function(){e1seed++;e1();});
$("e1-reset").addEventListener("click",function(){e1seed=1;$("e1-n").value=7;$("e1-noise").value=10;$("e1-shape").value="pos";$("e1-scale").value="1";$("e1-out").checked=false;e1();});

/* ================= Ex 2 ================= */
var X2=[5,7,8,7,2,17,2,9,4,11,12,9,6],Y2=[99,86,87,88,111,86,103,87,94,78,77,85,86];
var e2pts=X2.map(function(v,i){return[v,Y2[i]];}),e2preset="orig";
var e2sets={orig:function(){return X2.map(function(v,i){return[v,Y2[i]];});},
  drop2:function(){return X2.map(function(v,i){return[v,Y2[i]];}).filter(function(p){return p[0]!==2;});},
  drop17:function(){return X2.map(function(v,i){return[v,Y2[i]];}).filter(function(p){return p[0]!==17;});},
  outlier:function(){return X2.map(function(v,i){return[v,Y2[i]];}).concat([[20,120]]);},
  line:function(){return X2.map(function(v){return[v,100-2*v];});},
  rand:function(){var r=mulberry(Date.now()%100000);return X2.map(function(){return[1+Math.floor(r()*17),75+Math.floor(r()*37)];});}};
function e2(){
  var px=+$("e2-px").value;$("e2-px-o").textContent=px;
  document.querySelectorAll("[data-e2]").forEach(function(b){b.classList.toggle("on",b.dataset.e2===e2preset);});
  var x=e2pts.map(function(p){return+p[0].toFixed(1);}),y=e2pts.map(function(p){return+p[1].toFixed(1);});
  var ok=x.length>=3&&stdPop(x)>0,L=ok?linregress(x,y):null;
  plot($("e2-plot"),{xr:[0,25],yr:[50,130],xl:"x",yl:"y",pts:e2pts,
    lines:L?[{pts:[[0,L.intercept],[25,L.intercept+25*L.slope]]},{cls:"guide",pts:[[px,50],[px,L.intercept+L.slope*px]]}]:[],
    hot:L?[[px,L.intercept+L.slope*px]]:[],onClick:function(c){e2preset="";
      if(c.remove!==undefined)e2pts.splice(c.remove,1);else e2pts.push([Math.round(c.x*2)/2,Math.round(c.y)]);e2();},
    label:"Scatter of x and y with the fitted regression line"});
  $("e2-code").innerHTML="x = <b>"+esc(JSON.stringify(x).replace(/,/g,","))+"</b>\ny = <b>"+esc(JSON.stringify(y))+"</b>\n\nslope, intercept, r, p, std_err = stats.linregress(x, y)\nspeed = myfunc(<b>"+px+"</b>)";
  $("e2-out-txt").innerHTML=L?("Pearsons correlation: "+f3(L.r)+"\nslope = "+f3(L.slope)+"   intercept = "+f3(L.intercept)+
    "\nR² = "+f3(L.r*L.r)+"   p-value = "+(L.p<0.001?L.p.toExponential(2):f3(L.p))+"   n = "+x.length+
    "\nmyfunc("+px+") = "+f3(L.intercept+L.slope*px)+((px<Math.min.apply(null,x)||px>Math.max.apply(null,x))?'\n<span class="warn">x = '+px+' is outside the data (extrapolation)</span>':"")):
    '<span class="warn">Need at least 3 points with different x values.</span>';
}
$("e2-px").addEventListener("input",e2);
document.querySelectorAll("[data-e2]").forEach(function(b){b.addEventListener("click",function(){e2preset=b.dataset.e2;e2pts=e2sets[e2preset]();e2();});});

/* ================= Ex 3 ================= */
var CARS=[["Toyota Aygo",1000,790,99],["Mitsubishi Space Star",1200,1160,95],["Skoda Citigo",1000,929,95],["Fiat 500",900,865,90],
["Mini Cooper",1500,1140,105],["VW Up!",1000,929,105],["Skoda Fabia",1400,1109,90],["Mercedes A-Class",1500,1365,92],["Ford Fiesta",1500,1112,98],
["Audi A1",1600,1150,99],["Hyundai I20",1100,980,99],["Suzuki Swift",1300,990,101],["Ford Fiesta",1000,1112,99],["Honda Civic",1600,1252,94],
["Hundai I30",1600,1326,97],["Opel Astra",1600,1330,97],["BMW 1",1600,1365,99],["Mazda 3",2200,1280,104],["Skoda Rapid",1600,1119,104],
["Ford Focus",2000,1328,105],["Ford Mondeo",1600,1584,94],["Opel Insignia",2000,1428,99],["Mercedes C-Class",2100,1365,99],["Skoda Octavia",1600,1415,99],
["Volvo S60",2000,1415,99],["Mercedes CLA",1500,1465,102],["Audi A4",2000,1490,104],["Audi A6",2000,1725,114],["Volvo V70",1600,1523,109],
["BMW 5",2000,1705,114],["Mercedes E-Class",2100,1605,115],["Volvo XC70",2000,1746,117],["Ford B-Max",1600,1235,104],["BMW 2",1600,1390,108],
["Opel Zafira",1600,1405,109],["Mercedes SLK",2500,1395,120]];
function e3(){
  var useW=$("e3-w").checked,useV=$("e3-v").checked,set=$("e3-data").value,lit=$("e3-unit").value==="l";
  var pw=+$("e3-pw").value,pv=+$("e3-pv").value;$("e3-pw-o").textContent=pw;$("e3-pv-o").textContent=pv;
  var d=CARS.slice();if(set==="light")d=d.filter(function(c){return c[2]<=1600;});
  if(set==="slk")d=d.filter(function(c){return c[0]!=="Mercedes SLK";});if(set==="odd")d.push(["Test car",1000,2000,90]);
  var vs=lit?1000:1,cols=[];if(useW)cols.push("Weight");if(useV)cols.push(lit?"Volume_L":"Volume");
  var y=d.map(function(c){return c[3];}),W8=d.map(function(c){return c[2];});
  var out="",code="df = pandas.read_csv(\"cars.csv\")"+(set!=="all"?"\n<b>"+{light:"df = df[df.Weight &lt;= 1600]",slk:"df = df[df.Model != 'SLK']",odd:"df = concat([df, heavy_low_co2_car])"}[set]+"</b>":"")+
    (lit?"\n<b>df['Volume_L'] = df.Volume / 1000</b>":"")+"\n\nX = df[["+cols.map(function(c){return"'<b>"+c+"</b>'";}).join(", ")+"]]\ny = df['CO2']\nregr.fit(X, y)\nregr.predict([[";
  var hot=[],band=[[Math.min.apply(null,W8),Math.max.apply(null,W8),"weights in the data"]];
  if(!cols.length){out='<span class="warn">Pick at least one predictor.</span>';code+="...]])";}
  else{
    var rows=d.map(function(c){var r=[];if(useW)r.push(c[2]);if(useV)r.push(c[1]/vs);return r;}),w=ols(rows,y);
    var q=[];if(useW)q.push(pw);if(useV)q.push(pv/vs);var pred=w[0];q.forEach(function(v,i){pred+=w[i+1]*v;});
    var yh=rows.map(function(r){var o=w[0];r.forEach(function(v,i){o+=w[i+1]*v;});return o;});
    var z=cols.map(function(c,i){var col=rows.map(function(r){return r[i];});return w[i+1]*stdPop(col);});
    code+="<b>"+q.join(", ")+"</b>]])";
    out="regr.coef_       = ["+w.slice(1).map(function(v){return Math.abs(v)<0.01?v.toFixed(8):v.toFixed(5);}).join("  ")+"]   ("+cols.join(", ")+")"+
      "\nregr.intercept_  = "+f3(w[0])+"\nR²               = "+f3(r2(y,yh))+"   n = "+d.length+
      "\nper 1 SD change  = "+cols.map(function(c,i){return c+" "+z[i].toFixed(2)+" g";}).join(", ")+
      "\npredictedCO2     = ["+pred.toFixed(4)+"]";
    var Vd=d.map(function(c){return c[1];}),warn=[];
    if(useW&&(pw<Math.min.apply(null,W8)||pw>Math.max.apply(null,W8)))warn.push("weight "+pw+" kg is outside "+Math.min.apply(null,W8)+"–"+Math.max.apply(null,W8)+" kg");
    if(useV&&(pv<Math.min.apply(null,Vd)||pv>Math.max.apply(null,Vd)))warn.push("volume "+pv+" cm³ is outside "+Math.min.apply(null,Vd)+"–"+Math.max.apply(null,Vd)+" cm³");
    if(warn.length)out+='\n<span class="warn">Extrapolating: '+warn.join("; ")+"</span>";
    hot=[[pw,pred]];
  }
  plot($("e3-plot"),{xr:[700,3550],yr:[80,140],xl:"Weight (kg)",yl:"CO2 (g)",bands:band,pts:d.map(function(c){return[c[2],c[3]];}),hot:hot,
    label:"CO2 against weight for the cars in the data, with the predicted car marked"});
  $("e3-code").innerHTML=code;$("e3-out-txt").innerHTML=out;
}
["e3-w","e3-v","e3-data","e3-unit","e3-pw","e3-pv"].forEach(function(id){$(id).addEventListener("input",e3);});

/* ================= Ex 4 ================= */
var X4=[1,2,3,5,6,7,8,9,10,12,13,14,15,16,18,19,21,22],Y4=[100,90,80,60,60,55,60,65,70,70,75,76,78,79,90,99,99,100];
var base4=function(){return X4.map(function(v,i){return[v,Y4[i]];});},e4pts=base4(),e4preset="orig";
var e4sets={orig:base4,early:function(){return base4().filter(function(p){return p[0]>3;});},
  odd:function(){return base4().concat([[17,40]]);},
  noise:function(){var g=normalGen(Date.now()%100000);return base4().map(function(p){return[p[0],+(p[1]+8*g()).toFixed(1)];});}};
function loo(x,y,d){var s=0,n=0;for(var i=0;i<x.length;i++){var xx=x.filter(function(_,j){return j!==i;}),yy=y.filter(function(_,j){return j!==i;});
  var m=polyfit(xx,yy,d);if(!m)return NaN;s+=Math.pow(y[i]-m(x[i]),2);n++;}return Math.sqrt(s/n);}
function e4(){
  var d=+$("e4-d").value,px=+$("e4-px").value;$("e4-d-o").textContent=d;$("e4-px-o").textContent=px;
  document.querySelectorAll("[data-e4]").forEach(function(b){b.classList.toggle("on",b.dataset.e4===e4preset);});
  var x=e4pts.map(function(p){return p[0];}),y=e4pts.map(function(p){return p[1];});
  var m=polyfit(x,y,d),lines=[],hot=[];
  var lo=Math.min.apply(null,x),hi=Math.max.apply(null,x);
  if(m){var pts=[];for(var v=0;v<=31;v+=0.1)pts.push([v,m(v)]);lines.push({pts:pts});
    lines.push({cls:"guide",pts:[[px,0],[px,m(px)]]});hot=[[px,m(px)]];}
  plot($("e4-plot"),{xr:[0,31],yr:[20,150],xl:"hour of day",yl:"speed",pts:e4pts,lines:lines,hot:hot,
    bands:[[hi,31,"beyond the data"]],onClick:function(c){e4preset="";
      if(c.remove!==undefined)e4pts.splice(c.remove,1);else e4pts.push([Math.round(c.x*2)/2,Math.round(c.y)]);e4();},
    label:"Speed against hour with the fitted polynomial curve"});
  $("e4-code").innerHTML="x = <b>"+esc(JSON.stringify(x))+"</b>\ny = <b>"+esc(JSON.stringify(y))+"</b>\n\nmymodel = numpy.poly1d(numpy.polyfit(x, y, <b>"+d+"</b>))\nprint(r2_score(y, mymodel(x)))\nspeed = mymodel(<b>"+px+"</b>)";
  if(!m){$("e4-out-txt").innerHTML='<span class="warn">Degree '+d+' needs more than '+d+' points.</span>';}
  else{$("e4-out-txt").innerHTML="r2_score        = "+f3(r2(y,x.map(m)))+"\nleave-one-out   = "+f3(loo(x,y,d))+" (RMSE)\nmymodel("+px+")    = "+f3(m(px))+
    ((px>hi||px<lo)?'\n<span class="warn">hour '+px+' is outside the data ('+lo+'–'+hi+'): extrapolation</span>':"");}
  var rows=[],best=Infinity,bi=-1;for(var k=1;k<=9;k++){var mk=polyfit(x,y,k);var rr={k:k,r2:mk?r2(y,x.map(mk)):NaN,l:mk?loo(x,y,k):NaN,p:mk?mk(px):NaN};
    if(rr.l<best){best=rr.l;bi=k;}rows.push(rr);}
  $("e4-table").innerHTML="<tr><th>degree</th><th>R² (train)</th><th>leave-one-out RMSE</th><th>prediction @ "+px+"</th></tr>"+
    rows.map(function(r){return'<tr'+(r.k===d?' class="cur"':"")+'><td>'+r.k+"</td><td>"+f3(r.r2)+'</td><td'+(r.k===bi?' class="best"':"")+">"+f3(r.l)+"</td><td>"+f3(r.p)+"</td></tr>";}).join("");
}
["e4-d","e4-px"].forEach(function(id){$(id).addEventListener("input",e4);});
document.querySelectorAll("[data-e4]").forEach(function(b){b.addEventListener("click",function(){e4preset=b.dataset.e4;e4pts=e4sets[e4preset]();e4();});});

e1();e2();e3();e4();
})();
