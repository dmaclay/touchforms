
function removeAllChildren (element) {
  while (element.hasChildNodes()) {
    element.removeChild(element.firstChild);
  }
}

function render_viewport (vp, scene_graph) {
  var viewport = document.getElementById(vp);
  removeAllChildren(viewport);
  scene_graph.render(viewport);
}

function Indirect (key) {
  this.key
  this.parent = null;
  this.content = null;
  
  this.setParent = function (parent) {
    this.parent = parent;
  }
  
  this.update = function (content) {
    this.content = content;
    this.parent.update(this);
  }
}

function Layout (id, num_rows, num_cols, widths, heights, margins, spacings, color, margin_color, spacing_color, content) {
  this.id = id;

  this.num_rows = num_rows;
  this.num_cols = num_cols;
  if (num_rows < 1 || num_cols < 1) {
    throw new Error("invalid dimensions");
  }
  
  if (widths instanceof Array) {
    if (widths.length != num_cols) {
      throw new Error("widths don't match # cols");
    }
    this.widths = widths;
  } else { //single width to use for all columns
    this.widths = [];
    for (i = 0; i < num_cols; i++) {
      this.widths.push(widths)
    }
  }

  if (heights instanceof Array) {
    if (heights.length != num_rows) {
      throw new Error("heights don't match # rows");
    }
    this.heights = heights;
  } else { //single width to use for all columns
    this.heights = [];
    for (i = 0; i < num_rows; i++) {
      this.heights.push(heights)
    }
  }

  if (margins instanceof Array) {
    this.l_margin = margins[0];
    this.r_margin = margins[1];
    this.t_margin = margins[2];
    this.b_margin = margins[3];  
  } else {
    this.l_margin = margins;
    this.r_margin = margins;
    this.t_margin = margins;
    this.b_margin = margins;
  }
  
  if (spacings instanceof Array) {
    this.h_spacing = spacings[0];
    this.v_spacing = spacings[1];
  } else {
    this.h_spacing = spacings;
    this.v_spacing = spacings;
  }
  
  this.content = content;
  for (var i = 0; i < this.content.length; i++) {
    if (this.content[i] instanceof Indirect) {
      this.content[i].setParent(this);
    }
  }
  
  this.color = color;
  this.margin_color = margin_color;
  this.spacing_color = spacing_color;

  this.container = null;
  this.child_index = []; //[list of div for each child]
  
  this.update = function (ind) {
    position = this.content.indexOf(ind);
    
    if (this.container == null)
      return; //do nothing else if layout object has not been rendered yet
    
    subcontent = ind.content;
    if (subcontent != null && subcontent.container != null) {
      domNew = subcontent.container;
      this.container.replaceChild(domNew, this.child_index[position]);
    } else {
      domOld = this.child_index[position];
      r = Math.floor(position / this.num_cols);
      c = position % this.num_cols;
      x = domOld.offsetLeft;
      y = domOld.offsetTop;
      w = domOld.clientWidth;
      h = domOld.clientHeight;
      var domNew = new_div(subcontent != null ? subcontent.id : this.container.id + '-' + null + '-' + r + '-' + c, y, x, w, h);
      set_color(domNew, this.color, this.container.style.backgroundColor);

      this.container.replaceChild(domNew, this.child_index[position]);
      if (subcontent != null) {
        subcontent.render(domNew);
      }
    }
    this.child_index[position] = domNew;
  }
  
  this.render = function (parent) {
    render_layout(this, parent);
  }
}

function render_layout (layout, parent_div) {
  var widths = partition(parent_div.clientWidth, layout.widths, layout.l_margin, layout.r_margin, layout.h_spacing);
  var heights = partition(parent_div.clientHeight, layout.heights, layout.t_margin, layout.b_margin, layout.v_spacing);
  var woff = offsets(widths);
  var hoff = offsets(heights);
  var parent_color = parent_div.style.backgroundColor;
  
  if (has_margins(widths, heights)) {
    var inner_area = new_div(parent_div.id + '-inner', hoff[1], woff[1], ainv(woff, -1) - widths[0], ainv(hoff, -1) - heights[0]);
    parent_div.appendChild(inner_area);
    set_color(parent_div, layout.margin_color, parent_color);
  } else {
    var inner_area = parent_div;
  }
  
  if (has_spacing(widths, heights)) {
    set_color(inner_area, layout.spacing_color, parent_color);
  }
  
  layout.child_index = [];
  for (var r = 0; r < layout.num_rows; r++) {
    for (var c = 0; c < layout.num_cols; c++) {
      var x = woff[2*c + 1];
      var y = hoff[2*r + 1];
      var w = widths[2*c + 1];
      var h = heights[2*r + 1];
      
      var subcontent = layout.content[layout.num_cols * r + c];
      if (subcontent instanceof Indirect) {
        subcontent = subcontent.content;
      }
      
      if (subcontent == null || subcontent.container == null) {
        var subcell = new_div(subcontent != null ? subcontent.id : parent_div.id + '-' + null + '-' + r + '-' + c, y, x, w, h);
        layout.child_index.push(subcell);
      
        set_color(subcell, layout.color, parent_color);
        parent_div.appendChild(subcell);
        if (subcontent != null) {
          subcontent.render(subcell);
        }
      } else {
        layout.child_index.push(subcontent.container);
        parent_div.appendChild(subcontent.container);
      }
    }
  }
  
  layout.container = parent_div;
}

function has_margins (widths, heights) {
  return widths[0] > 0 || ainv(widths, -1) > 0 || heights[0] > 0 || ainv(heights, -1) > 0;
}

function has_spacing (widths, heights) {
  return (widths.length > 3 || heights.length > 3) && (widths[2] > 0 || heights[2] > 0);
}

//todo: auto-sizing?
function TextButton (id, color, text_color, selected_color, inactive_color, caption, size_rel, onclick, centered, cls) {
  this.id = id;
  this.color = color;
  this.text_color = text_color;
  this.selected_color = selected_color;
  this.inactive_color = inactive_color;
  this.caption = caption;
  this.size_rel = size_rel;
  this.onclick = onclick;
  this.centered = (centered != null ? centered : true);    
  this.cls = cls
  this.status = 'default';

  this.container = null;
  this.span = null;
  this.render = function (parent_div) {  
    this.container = parent_div;
    parent_div.id = uid(this.id);
    this.setColor();
    this.setClass();
    parent_div.innerHTML = '<table border="0" cellpadding="0" cellspacing="0" width="100%" height="100%"><tr><td align="' + (this.centered ? 'center' : 'left') + '" valign="middle"><span></span></td></tr></table>'
    span = parent_div.getElementsByTagName('span')[0];
    span.style.fontWeight = 'bold';
    span.style.fontSize = this.size_rel * 100. + '%';
    span.style.color = this.text_color;
    span.textContent = this.caption;
    parent_div.onclick = this.onclick;
    if (!this.centered) {
      span.style.marginLeft = .25 * parent_div.clientHeight + 'px';
    }
    this.span = span;
    parent_div.style.MozBorderRadius = '10px';
    parent_div.style.BorderRadius = '10px';
    parent_div.style.WebkitBorderRadius = '10px';
    
    
  }

  this.setText = function (text) {
    this.caption = text;
    if (this.span != null)
      this.span.textContent = text;
  }

  this.setClass = function() {
    if (this.cls && this.container) {
      if (this.status == 'default') {
	    this.container.setAttribute("class", this.cls);
	  } else if (this.status == 'selected') {
	    this.container.setAttribute("class", "selected " + this.cls);
	  }
	  else if (this.status == 'disabled') {
	    this.container.setAttribute("class", this.cls + " disabled");
	  }
	}
  }
    
  this.setColor = function () {
    if (this.status == 'default') {
      set_color(this.container, this.color, this.container.style.backgroundColor);
    } else if (this.status == 'selected') {
      if (this.selected_color == null)
        alert('no selected color set!');
      set_color(this.container, this.selected_color, null);
    } else if (this.status == 'disabled') {
      if (this.inactive_color == null)
        alert('no disabled color set!');
      set_color(this.container, this.inactive_color, null);
    }
  }

  this.toggleStatus = function () {
    if (this.status != 'disabled') {
      this.setStatus(this.status == 'default' ? 'selected' : 'default');
    }
  }

  this.setStatus = function (stat) {
    this.status = stat;
    if (this.container != null)
      this.setColor();
      this.setClass();
  }
}

function TextCaption (id, color, caption, size_rel, align, valign) {
  this.id = id;
  this.color = color;
  this.caption = caption;
  this.size_rel = size_rel;
  this.align = align;
  this.valign = valign;
  
  this.container = null;
  this.span = null;
  this.render = function (parent_div) {
    this.container = parent_div;
    parent_div.id = uid(this.id);
    parent_div.innerHTML = '<table border="0" cellpadding="0" cellspacing="0" width="100%" height="100%"><tr><td align="' + this.align + '" valign="' + this.valign + '"><span></span></td></tr></table>'
    span = parent_div.getElementsByTagName('span')[0];
    span.style.fontWeight = 'bold';
    span.style.fontSize = this.size_rel * 100. + '%';
    span.style.color = this.color;
    span.textContent = this.caption;
    this.span = span;
  }
  
  this.setText = function (text) {
    this.caption = text;
    if (this.span != null) {
      this.span.textContent = text;
      this.span.style.fontSize = this.fitText(text, this.container.offsetWidth, 50., this.size_rel * 100., span.style) + '%';
    }
  }


  this.fitText = function(text, width, min_size, max_size, style) {
	var tmp = document.createElement("span");
	
	tmp.style.visibility = "hidden";
	tmp.style.padding = "0px";
	document.body.appendChild(tmp);
	tmp.innerHTML = text;

	tmp.style.cssText = this.span.style.cssText;

	tmp.style.fontSize = max_size + '%';
	var curSize = max_size;

	//console.debug("calling fitText, tmp.offsetWidth is " + tmp.offsetWidth + ", parent_div.offsetWidth is " + width, ", text is " + text); 

	if (tmp.offsetWidth > width) {
		var minSize = min_size;
		var maxSize = max_size;

		while(true){
			curSize = minSize + Math.floor((maxSize - minSize) / 2);
			tmp.textContent = text;
			tmp.style.fontSize = curSize + '%';
			//console.debug("size:" + curSize + ", min: " + minSize + ", max: " + maxSize + ", cur: " + curSize + " width: " + tmp.offsetWidth);
			if (curSize == maxSize || curSize == minSize) {
				break;
			} else if (tmp.offsetWidth > width) {
				maxSize = curSize;
			} else {
				minSize = curSize;
			}		
		};
	}
	//console.debug("returning " + curSize);
	document.body.removeChild(tmp);
	return curSize;
  }
}

function TextInput (id, color, bgcolor, content, size_rel, align, spacing, passwd) {
  this.id = id;
  this.color = color;
  this.bgcolor = bgcolor;
  this.content = content;
  this.size_rel = size_rel;
  this.align = align;
  this.spacing = spacing;
  this.passwd = passwd;
  this.maxlen = -1;

  this.container = null;
  this.control = null;
  this.render = function (parent_div) {
    this.container = parent_div;
    parent_div.innerHTML = '<table border="0" cellpadding="0" cellspacing="0" width="100%" height="100%"><tr><td valign="middle"><input></input></td></tr></table>'
    inp = parent_div.getElementsByTagName('input')[0];
    inp.id = uid(this.id);
    
    set_color(parent_div, this.bgcolor, parent_div.style.backgroundColor);
    inp.style.backgroundColor = (this.bgcolor != null ? this.bgcolor : parent_div.style.backgroundColor);
    inp.style.color = this.color;
    inp.style.borderWidth = '0px';
    inp.style.height = '100%';
    inp.style.width = '100%';
    inp.style.fontWeight = 'bold';
    inp.style.fontSize = this.size_rel * 100. + '%';
    inp.style.textAlign = this.align;
    if (this.spacing != null) {
      inp.style.letterSpacing = this.spacing + 'px';
    }
    inp.value = content;
    inp.type = (this.passwd ? 'password' : 'text');
    this.control = inp;
  }
  
  this.setText = function (text) {
    this.content = text;
    if (this.control != null)
      this.control.value = text;
  }

  this.setMaxLen = function (maxlen) {
    maxlen = maxlen || -1;
    this.maxlen = maxlen;
    if (this.control != null)
      this.control.maxLength = maxlen;
  }
}

function uid (id) {
  if (id == null || id == '')
    id = "id-" + Math.floor(Math.random() * 1000000000);
    return id;
}

function new_div (id, top, left, width, height) {
  var div = document.createElement("div");
  div.id = uid(id);
  div.style.position = 'absolute';
  div.style.top = top + "px";
  div.style.left = left + "px";
  div.style.width = width + "px";
  div.style.height = height + "px";
  return div;
}

function endswith (x, suffix) {
  var sx = String(x);
  return sx.substring(sx.length - suffix.length) == suffix;
}

function partition (dim, cells, margin_lo, margin_hi, spacing) {
  //create partitions
  var sizes = new Array();
  var count = 2*cells.length + 1;
  for (var i = 0; i < count; i++) {
    if (i == 0) {
      sizes[i] = margin_lo;
    } else if (i == count - 1) {
      sizes[i] = margin_hi;
    } else if (i % 2 == 0) {
      sizes[i] = spacing;
    } else {
      sizes[i] = cells[(i - 1) / 2];
    }
  }
  
  //normalize percentage-based widths
  var pct0 = 0.;
  var px0 = 0;
  for (var i = 0; i < sizes.length; i++) {
    if (endswith(sizes[i], '%')) {
      var pct = parseFloat(sizes[i].substring(0, sizes[i].length - 1)) / 100.;
      var px = Math.round(dim * (pct0 + pct)) - px0;
      sizes[i] = px;
      pct0 += pct;
      px0 += px;
    }
  }
  //pct0 and px0 needed to evenly distribute rounding error
  
  //normalize proportional-based widths
  var sum = 0;
  var proport = new Array();
  var sum_proport = 0.;
  for (var i = 0; i < sizes.length; i++) {
    if (endswith(sizes[i], '*')) {
      var sfactor = sizes[i].substring(0, sizes[i].length - 1);
      var prop = Math.round(sfactor.length > 0 ? parseFloat(sfactor) : 1.);
      proport.push(prop)
      sum_proport += prop;
    } else {
      sum += sizes[i];
      proport.push(-1);
    }
  }
  if (sum > dim) {
    throw Error("too big for allowed width!")
  }
  var pp0 = 0.;
  var px0 = 0;
  for (var i = 0; i < proport.length; i++) {
    if (proport[i] != -1) {
      var px = Math.round((dim - sum) * (pp0 + proport[i]) / sum_proport) - px0;
      sizes[i] = px;
      pp0 += proport[i];
      px0 += px;
    }
  }
  //pp0 and px0 needed to evenly distribute rounding error
  
  var sum = 0;
  for (var i = 0; i < sizes.length; i++) {
    sum += sizes[i];
  }
  if (sum != dim) {
    throw Error("not all space consumed!");
  }
  
  return sizes;
}

function offsets (dims) {
  var off = 0;
  var offs = new Array();
  for (var i = 0; i < dims.length; i++) {
    offs.push(off);
    off += dims[i];
  }
  return offs;
}

function set_color (elem, color, fallback_color) {
  elem.style.backgroundColor = (color != null && color != '' ? color : fallback_color);
}

function ainv (arr, i) {
  return arr[arr.length - Math.abs(i)];
}

function Top (main, overlay) {
  this.main = main;
  this.overlay = overlay;
  
  this.render = function (parent_div) {
    var maindiv = new_div('main', 0, 0, parent_div.clientWidth, parent_div.clientHeight);
    parent_div.appendChild(maindiv);
    this.main.render(maindiv);
    
    if (this.overlay != null) {
      var ovdiv = new_div('overlay', 0, 0, parent_div.clientWidth, parent_div.clientHeight);
      parent_div.appendChild(ovdiv);  
      this.overlay.render(ovdiv);
    }
  }
}

function htmlescape (raw) {
  raw = raw.replace(/&/g, '&amp;');
  raw = raw.replace(/</g, '&lt;');
  raw = raw.replace(/>/g, '&gt;');
  raw = raw.replace(/\'/g, '&apos;');
  raw = raw.replace(/\"/g, '&quot;');
  return raw;
}

function Overlay (mask_color, bg_color, timeout, fadeout, text_content) {
  this.mask_color = mask_color;
  this.bg_color = bg_color;
  this.fadeout = fadeout * 1000.;
  this.text = text_content;
  this.ondismiss = null;
  this.choices = null;
  this.actions = null;

  this.active = null;  
  this.container = null;
  this.timeout_id = null;
  
  this.setTimeout = function (to) {
    this.timeout = to * 1000.;
  }
  this.setTimeout(timeout);
  
  this.setActive = function (state, manual) {
    if (this.active && state) {
      return; //do nothing if already active
    }
    
    this.active = state;
      
    if (state) {
      this.container.style.display = 'block';
      if (this.timeout != null && this.timeout > 0) {
        self = this;
        this.timeout_id = setTimeout(function () {
          self.timeout_id = null;
          if (self.fadeout != null && self.fadeout > 0) {
            $(self.container).fadeOut(self.fadeout, function () {self.setActive(false);});
          } else {
            self.setActive(false);
          } 
        }, this.timeout);
      }
    } else {
      if (manual)
        $(this.container).stop(true, true);
      this.container.style.display = 'none';
      if (this.timeout_id != null)
        clearTimeout(this.timeout_id);
      if (this.ondismiss) {
        this.ondismiss();
      }
    } 
  }
  
  this.span = null;
  this.mask = null;
  
  this.setText = function (text, choices, actions) {
    this.text = text;
    this.choices = choices;
    this.actions = actions;

    if (this.span != null)
      this.renderContent();
  }
  
  this.setBgColor = function (color) {
    this.mask_color = color;
    if (this.mask != null)
      this.mask.style.backgroundColor = color;
  }
  
  this.setDismiss = function (ondismiss) {
    this.ondismiss = ondismiss;
  }

  this.renderContent = function () {
    var content = htmlescape(this.text);

    if (!this.choices)
      this.choices = [];

    if (this.choices.length > 0) {
      content += '<br><br>';
      for (var i = 0; i < this.choices.length; i++) {
        content += '<table class="shiny-button rounded" id="alert-ch' + i + '" ' + (this.choices.length == 1 ? 'align="center" ' : '') + 'cellpadding="7" style="color: white; font-weight: bold; margin-bottom: 5px; ">\
          <tr><td><strong>&nbsp;' + htmlescape(this.choices[i]) + '&nbsp;</strong></td></tr></table>';
      }
    }

    this.span.innerHTML = content;

    if (this.choices.length > 0) {
      for (var i = 0; i < this.choices.length; i++) {
        document.getElementById('alert-ch' + i).onclick = this.omfg(i);
      }
      this.container.onclick = null;
    } else {
      var self = this;
      this.container.onclick = function () {  self.setActive(false, true); };
    }
  }

  //javascript has a HUGE gotcha if you try to define function closures inside a for loop
  this.omfg = function (i) {
    var self = this;
    return function () {
      self.setDismiss(self.actions[i]);
      self.setActive(false, true);
    };
  }

  this.render = function (parent_div) {
    this.container = parent_div;
  
    mask = new_div('mask', 0, 0, parent_div.clientWidth, parent_div.clientHeight);
    mask.style.backgroundColor = this.mask_color;
    mask.style.opacity = .7;
    parent_div.appendChild(mask);
    this.mask = mask;
    
    content = document.createElement('div');
    content.style.position = 'relative';
    content.style.top = '175px';
    content.style.width = '70%';
    content.style.marginLeft = 'auto';
    content.style.marginRight = 'auto';
    
    span = document.createElement('div');
    span.id = 'overlay-content';
    span.style.border = '3px solid black';
    span.style.padding = '20px';
    span.style.backgroundColor = this.bg_color;
    //god damnit css!!!
    this.span = span;

    content.appendChild(span);
    parent_div.appendChild(content);
    this.renderContent();
    
    this.setActive(false);
  }
}

function InputArea (id, border, border_color, padding, inside_color, child, onclick) {
  this.id = id;
  this.border = border;
  this.border_color = border_color;
  this.padding = padding;
  this.inside_color = inside_color;
  this.child = child;
  this.onclick = onclick;

  this.layout;
  this.container = null;

  //yikes! this didn't turn out that well
  this.setBgColor = function (bg_color) {
    this.inside_color = bg_color;
    if (this.padding > 0) {
      this.layout.child_index[0].style.backgroundColor = bg_color;
      this.layout.content[0].child_index[0].style.backgroundColor = bg_color;
    } else {
      this.layout.child_index[0].style.backgroundColor = bg_color;
    }
    if (this.child instanceof TextInput) {
      this.child.control.style.backgroundColor = bg_color;
    }
  }
  
  this.setText = function (text) {
    this.child.setText(text);
  }
  
  this.setMaxLen = function (maxlen) {
    this.child.setMaxLen(maxlen);
  }

  this.render = function (parent_div) {
    if (this.padding > 0) {
      inside = new Layout(id + '-padded', 1, 1, '*', '*', padding, 0, null, null, null, [this.child]);
    } else {
      inside = this.child;
    }
    this.layout = new Layout(id, 1, 1, '*', '*', border, 0, this.inside_color, this.border_color, null, [inside]);
    this.layout.render(parent_div);
    this.container = this.layout.container;
    this.container.onclick = this.onclick;
  }
}

function CustomContent (id, content) {
  this.id = id;
  this.content = content;

  this.container = null;

  this.render = function (parent_div) {
    this.container = parent_div;
    parent_div.innerHTML = this.content;
  }
}