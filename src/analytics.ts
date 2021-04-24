var gaNewElem : any = {};
var gaElems : any = {};

function gaInit(){

  var currdate : any = new Date();

  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*currdate;a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga', gaNewElem, gaElems);
  
  //ga('create', 'UA-194964708-1', 'auto'); //for dev
  ga('create', 'UA-194964708-2', 'auto');
  
  ga('set', 'checkProtocolTask', null);
  ga('send', 'pageview', '/popup');

  var query = { active: true, currentWindow: true };
  chrome.tabs.query(query, (tabs)=>{
      ga('send', 'event', {'eventCategory' : 'Url', 'eventAction' : 'current_url', 'eventLabel' : tabs[0].url});
  });
}

(function() {
  gaInit();
})();