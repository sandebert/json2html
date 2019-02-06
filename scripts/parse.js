function escapeHTML(unsafe) {
  if(unsafe == null) return "";
  return unsafe.toString()
   .replace(/&/g, "&amp;")
   .replace(/</g, "&lt;")
   .replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;")
   .replace(/'/g, "&#039;");
}

var elementCount = 0;
var arrayCount = 0;
var objectCount = 0;
var nestingLevel = 0;

function doStats() {
  var out = "<input type='button' id='statst' onclick='showStats();' value='Show Statistics' style='float: right;' />\n"
   + "<div class='clear'></div>\n"
    + "<div id='statscon'>\n<table>\n<tr>\n<td>Number of Arrays:</td>\n<td>" + arrayCount + "</td>\n</tr>\n"
    + "<tr>\n<td>Number of Objects:</td>\n<td>" + objectCount + "</td>\n</tr>\n"
     + "<tr>\n<td>Total number of all elements:</td>\n<td>" + elementCount + "</td>\n</tr>\n"
      + "<tr>\n<td>Nesting depth:</td>\n<td>" + nestingLevel + "</td>\n</tr>\n"
      + "</table>\n</div>\n</div>\n";
  return out;
}

function parse(str) {
  try {
    return JSON.parse(str);
  }
  catch(e) {
    if(e instanceof SyntaxError) {
      alert("There was a syntax error in your JSON string.\n" + e.message + "\nPlease check your syntax and try again.");
    }
    else {
      alert("There was an unknown error. Perhaps the JSON string contained a deep level of nesting.");
    }

    $("#text").focus();
    return;
  }
}

function transform(val, parent, level) {
  var type = typeof(val);

  if(type == "object") {
    if(val instanceof Array) return transformArray(val, parent, level);
    return transformObject(val, parent, level);
  }

  if(type == "string") return { type: "string", value: val };
  if(type == "number") return { type: "number", value: val.toString() };
  if(type == "boolean") return { type: "boolean", value: val.toString() };
  return { type: "void", value: "(null)" };
}

function transformArray(val, parent, level) {
  var parent = parent + (parent != "" ? " > " : "") + "Array (" + val.length + " item" + (val.length != 1 ? "s)" : ")");

  var tuples = [];
  for(prop in val) {
    if(typeof(val[prop]) == "function") continue;

    var tuple = transform(val[prop], parent, level + 1);
    tuple.name = prop;
    tuples.push(tuple);
  }

  return {
    type: "array",
    breadcrumbs: parent,
    tuples: tuples
  };
}

function transformObject(val, parent, level) {
  var i = 0;
  for(prop in val) {
    if(typeof(val[prop]) != "function") i++;
  }

  var parent = parent + (parent != "" ? " > " : "") + "Object (" + i + " item" + (i != 1 ? "s)" : ")");

  var tuples = [];
  for(prop in val) {
    if(typeof(val[prop]) == "function") continue;

    var tuple = transform(val[prop], parent, level + 1);
    tuple.name = prop;
    tuples.push(tuple);
  }

  return {
    type: "object",
    breadcrumbs: parent,
    tuples: tuples
  };
}

function render(val) {
  if(val.type == "array") return renderArray(val);
  if(val.type == "object") return renderObject(val);
  return "<span class='" + val.type + "'>" + escapeHTML(val.value) + "</span>";
}

function renderArray(array) {
  //arrayCount++;
  if(!array.tuples.length) return "(empty <span class='titled' title='" + array.breadcrumbs + "'>Array</span>)";

  var out = "<div class='array' onmouseover='doFocus(event, this);'><div class='widget'></div><h3><span class='titled' title='" + array.breadcrumbs + "'>Array</span></h3>";
  out += "<table><tr><th>Index</th><th>Value</th></tr>";

  for(var i = 0; i < array.tuples.length; i++) {
    var tuple = array.tuples[i];
    out += "<tr><td>" + escapeHTML(tuple.name) + "</td>";
    out += "<td class='" + tuple.type + "'>";
    
    if(tuple.type == "string" || tuple.type == "number" || tuple.type == "boolean" || tuple.type == "void") {
      out += escapeHTML(tuple.value);
    }
    else if(tuple.type == "array") {
      out += renderArray(tuple);
    }
    else if(tuple.type == "object") {
      out += renderObject(tuple);
    }
    out += "</td></tr>";
  }

  out += "</table></div>";
  return out;
}

function renderObject(object) {
  if(!object.tuples.length) return "(empty <span class='titled' title='" + object.breadcrumbs + "'>Object</span>)";

  var out = "<div class='object' onmouseover='doFocus(event, this);'><div class='widget'></div><h3><span class='titled' title='" + object.breadcrumbs + "'>Object</span></h3>";
  out += "<table><tr><th>Name</th><th>Value</th></tr>";

  for(var i = 0; i < object.tuples.length; i++) {
    var tuple = object.tuples[i];
    out += "<tr><td>" + escapeHTML(tuple.name) + "</td>";
    out += "<td class='" + tuple.type + "'>";
    
    if(tuple.type == "string" || tuple.type == "number" || tuple.type == "boolean" || tuple.type == "void") {
      out += escapeHTML(tuple.value);
    }
    else if(tuple.type == "array") {
      out += renderArray(tuple);
    }
    else if(tuple.type == "object") {
      out += renderObject(tuple);
    }
    out += "</td></tr>";
  }

  out += "</table></div>";
  return out;
}

function json2html(str) {
  elementCount = 0;
  arrayCount = 0;
  objectCount = 0;

  var tree = parse(str);
  if(!tree) return;
  var transformedTree = transform(tree, "", 1);
  var result = render(transformedTree);
  $("#output").innerHTML = result;

  $("#stats").innerHTML = doStats();
  $("#stats").className = "";

  //doTooltips();

  $("#submit").value = "json 2 html";
  $("#submit").disabled = null;

  $("#output").scrollIntoView();
}

function doParse() {
  $("#submit").value = "processing...";
  $("#submit").disabled = "disabled";

  setTimeout(doParse2, 50);
}

function doParse2() {
  var value = $("#text").value;
  if(value.substr(0, 4) == "http" || value.substr(0, 4) == "file" || value.substr(0, 3) == "ftp") {
    getURL(value);
  }
  else {
    json2html(value);
  }
}

function getURL(str) {
  var http = new XMLHttpRequest();
  http.open("get", "get.php?url=" + str);
  http.onreadystatechange = function() {
    if(http.readyState == 4) json2html(http.responseText);
  };
  http.send(null);
}

function showStats() {
  if($("#statscon").style.display != "block") {
    $("#statscon").style.display = "block";
    $("#stats").className = "statson";
    $("#statst").value = "Hide Statistics";
  }
  else {
    $("#statscon").style.display = "none";
    $("#stats").className = "";
    $("#statst").value = "Show Statistics";
  }
}

function toggleVisibility(widget) {
  widget.classList.toggle("minimised");

  var table = widget.parentNode.querySelector("table");
  if(!table) return;

  table.classList.toggle("hidden");
}

var currentlyFocused = null;
function doFocus(event, ele) {
  if(currentlyFocused != null) currentlyFocused.style.border = "1px solid #000000";
  ele.style.border = "1px solid #ffa000";

  currentlyFocused = ele;

  if(!event) event = window.event;
  event.cancelBubble = true;
  if(event.stopPropagation) event.stopPropagation();
}

function stopFocus() {
  if(currentlyFocused != null) currentlyFocused.style.border = "1px solid #000000";
}

//code from Painfully Obvious.
//based on code from quirksmode.org
var Client = {
  viewportWidth: function() {
  return self.innerWidth || (document.documentElement.clientWidth || document.body.clientWidth);
  },

  viewportHeight: function() {
   return self.innerHeight || (document.documentElement.clientHeight || document.body.clientHeight);
  },

  viewportSize: function() {
   return { width: this.viewportWidth(), height: this.viewportHeight() };
  }
};

function doHelp() {
  $("#help-content").style.display = "block";
  bodySize = Client.viewportSize();

  $("#backdrop").style.display = "block";

  $("#help-content").style.left = ((bodySize.width / 2) - ($("#help-content").offsetWidth / 2)) + "px";
  $("#help-content").style.top = ((bodySize.height / 2) - ($("#help-content").offsetHeight / 2)) + "px";
  $("body").scrollIntoView();
}

function hideHelp() {
  $("#help-content").style.display = "none";
  $("#backdrop").style.display = "none";
  $("#text").focus();
}

function clearPage() {
  $("#stats").innerHTML = "";
  $("#output").innerHTML = "";
}

function load() {
  window.$ = document.querySelector.bind(document);

  document.body.addEventListener("click", function(event) {
    if(event.target.matches(".widget")) {
      event.preventDefault();
      toggleVisibility(event.target);
    }
  });

  enableTooltips();

  bodySize = Client.viewportSize();

  if($("#text").focus) $("#text").focus();
}

window.onload = load;