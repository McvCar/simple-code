// panel/index.js, this filename needs to match the one registered in package.json
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
  },

  // register your ipc messages here
  messages: {
    'refresh-preview' (event,msg) {
      this.upPreview()
    }
  }
});