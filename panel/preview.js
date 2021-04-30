// panel/index.js, this filename needs to match the one registered in package.json

const version 		= Editor.remote.App.version.replace(/[.]/g,'')

Editor.Panel.extend({
  // css style for panel
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
    #games_view {width:100%; height:100%}
  `,

  // html template for panel
  template: `
      <iframe id = "games_view" src="" />
  `,

  // element and variable binding
  $: {
		games_view: '#games_view',
  },

  // method executed when template and styles are successfully loaded and initialized
  ready () {
    setTimeout(()=>this.upPreview(),5000)
  },

  upPreview(){
    let url = 'http://localhost:7456/'
    if(document.getElementById("toolbar"))
    {
      url = 'http://'+document.getElementById("toolbar").__vue__.$data.url;
    }else if(document.getElementById("playButtons"))
    {
      url = 'http://'+document.getElementById("playButtons").dataHost.previewURL;
    }
    this.$games_view.src = url;
    window.preview =  this.$games_view;

    if(version>=200 && version<246){
      return;
    }
    
    let id 
    id = setInterval(()=>{  
      if(preview.contentWindow && preview.contentWindow.cc){
        clearInterval(id);

        let log = preview.contentWindow.console.log
        preview.contentWindow.console.log = (...args)=>{
          Editor.log(...args);
        }

        let warn = preview.contentWindow.console.warn
        preview.contentWindow.console.warn = (...args)=>{
          Editor.warn(...args);
        }

        let error = preview.contentWindow.console.error
        preview.contentWindow.console.error = (...args)=>{
          Editor.error(...args);
        }
        preview.contentWindow.cc.log = preview.contentWindow.console.log
        preview.contentWindow.cc.warn = preview.contentWindow.console.warn
        preview.contentWindow.cc.error = preview.contentWindow.console.error
      }
    },500);
    if(Editor.monaco){
      Editor.monaco.preview = preview;
    }
  },

  // register your ipc messages here
  messages: {
    'refresh-preview' (event,msg) {
      this.upPreview()
    }
  }
});