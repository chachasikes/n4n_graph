var app = {};
  
app.fill = d3.scale.category20().range(["#ffa20f","#96ff09","#ff5c77", "#5469e2", "#efef18", "#9b6dcc"]);

app.renderCloud = function(data) {
  app.items = data.children[0];  
  app.keys = Object.keys(app.items);

  d3.layout.cloud().size([800, 780])
      .words(app.keys.map(function(d) {
      
        var label = d;
        var count = app.items[d].length;

        return {text: label, size: 20 + (count * 1.5)};
      }))
      .rotate(function() { return ~~(Math.random() * 2) * 90; })
      .font("Passion One")
      .fontSize(function(d) { return d.size; })
      .on("end", app.draw)
      .start();
      
      
  $('text').bind('click',function(){

    app.showContents($(this));
  });    
};

app.showContents = function(item){
  var key = item.attr('id');
  var color = item.attr('color');

  var tagItems = app.items[key];
  var count = tagItems.length;
  
  var output = '<h3>' + key + '</h3>'
  output += '<span class="count">' +  tagItems.length + '</span>';
  
  for(var i in tagItems) {
    item = tagItems[i];
    
    var string = '';
    if(item.type) {
    

      string += '<span class="type">' + (item.type).toUpperCase() + "</span>";
    }
    string += item.statement;
    output += '<div class="item">' + string;
    
    output += '<span class="attribution">';
    if(item.name || item['social\ media']) {
      output += item.name;
      if(item['social\ media']) {
        output += ' ' + item['social\ media'];
      }
    }
    output += '</span> <br /></div>';
  }
  console.log(output);
  $('.content').html(output);
  $('.contents').css('background-color', color);
  
};

app.draw = function(words) {

  
    d3.select(".graph").append("svg")
        .attr("width", 800)
        .attr("height", 780)
      .append("g")
        .attr("transform", "translate(400,390)")
      .selectAll("text")
        .data(words)
      .enter().append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Passion One")
        .style("fill", function(d, i) { return app.fill(i); })
        .attr("text-anchor", "middle")
        .attr("color", function(d, i) { return app.fill(i); })
        .attr("id", function(d){
          return d.text;
        })
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
};




var tags = Core.query2('/tags',app.renderCloud);
