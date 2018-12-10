
// start out with filter features set to false, so no filtering happens by default
var source_filters = { 
  iPhone: false,
  Android: false,
  Web_Client: false,
  iPad: false,
  Twitter_Lite: false,
  TweetDeck: false,
  Instagram: false,
  Facebook: false};

var emoji_filters = {

};

//triggered by the button click and filter the marker
/*$(function() {
    $('input[name=source_filter]').change(function (e) {
     //set the filters object to reflect the selection on the screen
     console.log('source change detected');
      map_filter(this.id);
      filter_markers();
      reload_bargraph(get_set_options(),'all');
  });
    $('input[name=emoji_filter]').change(function (e) {
     //set the filters object to reflect the selection on the screen
     console.log('emoji change detected');
  });
})*/

$(document).on('change','[type=checkbox]', function(){
  console.log(this);
  map_filter(this.name, this.id);
  filter_markers();
  reload_bargraph(get_set_options(source_filters),get_set_options(emoji_filters));
})

//Check which check button has been clicked.
var get_set_options = function(filters) {
  ret_array = []
  for (option in filters) {
    if (filters[option]) {
      ret_array.push(option)
    }
  }
  return ret_array;
}

var set_source_keep = function(dev_opt, marker){
    // start the filter check assuming the marker will be displayed
    // if any of the required features are missing, set 'keep' to false
    // to discard this marker
  var dev_keep=false;
  // for each selected 
  for (opt=0; opt<dev_opt.length; opt++) {
    if (marker.source==dev_opt[opt]) {
      dev_keep = true;
      break;
    }
  }
  return dev_keep;
}

var set_emo_keep = function(emo_opt, marker){
    // start the filter check assuming the marker will be displayed
    // if any of the required features are missing, set 'keep' to false
    // to discard this marker
  var emo_keep=false;
  // for each selected 
  for(opt=0;opt<emo_opt.length;opt++){
    for(optm=0; optm<marker.emojis.length; optm++){
      if(marker.emojis[optm].emoji_type === emo_opt[opt]){
        emo_keep = true;
        break;
      }
    }
  }
  return emo_keep;
}

var filter_markers = function() {  
  //get all the clicked button
  var dev_opt = get_set_options(source_filters);
  var emo_opt = get_set_options(emoji_filters);
  
  console.log('The new selected items are:',dev_opt);
  // for each marker, check to see if all required options are set
  for (i = 0; i < markers.length; i++) {
    var dev_keep = true;
    var emo_keep = true;
    marker = markers[i];

    if(dev_opt.length>0){
      dev_keep = set_source_keep(dev_opt, marker);
    }

    if(emo_opt.length>0){
      emo_keep = set_emo_keep(emo_opt, marker);
    }
    marker.setVisible(dev_keep&&emo_keep);
  }
}

//set the filters object to reflect the selection on the screen
var map_filter = function(name, id_val) {
  console.log('map_filter: change the status of',id_val);
  if(name==='source_filter'){
    if (source_filters[id_val]) 
      source_filters[id_val] = false;
    else
      source_filters[id_val] = true;
  }
  else{
    if(emoji_filters[id_val])
      emoji_filters[id_val] = false;
    else
      emoji_filters[id_val] = true;
  }
}

function data_transfer(source, emoji){
  var data = markers;
  var new_data = [];

  for(i=0;i<data.length;i++){
    var source_match = false;
    var emoji_match = false;

    var tweet_country = data[i].country;
    var tweet_source = data[i].source;
    var tweet_emoji = data[i].emojis;

    if(source === 'all'){ source_match = true;}
    else{
      for(j=0;j<source.length;j++){
        if(tweet_source===source[j]){
          source_match = true;
          break;
        }
      }
    }

    if(emoji === 'all'){ emoji_match = true;}
    else{
      for(k=0;k<emoji.length;k++){
        for(p=0;p<tweet_emoji.length;p++){
          if(emoji[k] === tweet_emoji[p].emoji_type){
            emoji_match = true;
            break;
          }
        }
      }
      
    }

    if(source_match===true && emoji_match==true){
      for (q=0; q<new_data.length; q++){
        if( tweet_country === new_data[q].country){
          new_data[q].count += 1;
          break;
        }
      }
      if(q>=new_data.length){
        var new_country = {'country': tweet_country, 'count': 1};
        new_data.push(new_country);
      }
    }
  }
  new_data.sort(function(a,b){ return b.count - a.count; });
  return new_data;
}

function load_bargraph(){
  var data = data_transfer('all', 'all');
  var filter_data =[]

  for(i=0;i<10;i++){
    filter_data.push(data[i]);
  }

  var svg = d3.select('svg');
  var svgContainer = d3.select('#container');

  const margin = 60;
  var width = $('#container').width() - 2 * margin;
  var height = $('#container').height() - 2 * margin;

  var chart = svg.append('g').attr('class','chart')
      .attr('transform', `translate(${margin}, ${margin})`);

  var xScale = d3.scaleBand()
      .range([0, width])
      .domain(filter_data.map((marker) => marker.country))
      .padding(0.3)

  var yScale = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(filter_data.map((marker)=>marker.count))*1.1]);

  var makeYLines = () => d3.axisLeft().scale(yScale);

  chart.append('g')
    .attr('class','axisBottom')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale));

  chart.append('g')
    .attr('class','axisLeft')
    .call(d3.axisLeft(yScale));

  chart.append('g')
      .attr('class', 'grid')
      .call(makeYLines()
        .tickSize(-width, 0, 0)
        .tickFormat('')
      );

  var barGroups = chart.selectAll()
      .data(filter_data)
      .enter()
      .append('g')
      .attr('class','barGroup');

  barGroups.append('rect')
      .attr('class','bar')
      .attr('x', (d)=>xScale(d.country))
      .attr('y', (d)=>yScale(d.count))
      .attr('height', (d)=>height-yScale(d.count))
      .attr('width', xScale.bandwidth())
      .on('mouseover', function(d,i){
        d3.selectAll('.count').attr('opacity',0);
        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', 0.6)
          .attr('x',(a)=>xScale(a.country)-2)
          .attr('width', xScale.bandwidth()+4);

        line = chart.append('line')
          .attr('id','limit')
          .attr('x1',0)
          .attr('y1',yScale(d.count))
          .attr('x2', width)
          .attr('y2',yScale(d.count))

        barGroups.append('text')
          .attr('class', 'divergence')
          .attr('x', (a) => xScale(a.country) + xScale.bandwidth() / 2)
          .attr('y', (a) => yScale(a.count)-5)
          .attr('text-anchor', 'middle')
          .text((a, idx) => {
            var divergence = a.count - d.count
            
            let text = ''
            if (divergence > 0) text += '+'
            text += `${divergence}`

            return idx !== i ? text : '';})
      })
      .on('mouseout',function(){
        d3.selectAll('.count')
          .attr('opacity',1)

        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity',1)
          .attr('x',(a)=>xScale(a.country))
          .attr('width', xScale.bandwidth())

          chart.selectAll('#limit').remove()
          chart.selectAll('.divergence').remove()
      });

      barGroups.append('text')
        .attr('class','count')
        .attr('x', (a) => xScale(a.country)+xScale.bandwidth()/2)
        .attr('y', (a) => yScale(a.count) - 5)
        .attr('text-anchor','middle')
        .text((a)=>`${a.count}`)

      svg.append('text').attr('class','label')
        .attr('x', -(height/2)-margin)
        .attr('y', margin/2.5)
        .attr('transform','rotate(-90)')
        .attr('text-anchor','middle')
        .text('Tweet Count')

      svg.append('text')
        .attr('class', 'label')
        .attr('x', width / 2 + margin)
        .attr('y', height + margin * 1.7)
        .attr('text-anchor', 'middle')
        .text('Country')

      svg.append('text')
        .attr('class', 'title')
        .attr('x', width / 2 + margin)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .text('Tweet Count by Country')

      svg.append('text')
        .attr('class', 'source')
        .attr('x', width - margin / 2)
        .attr('y', height + margin * 1.7)
        .attr('text-anchor', 'start')
        .text('Source: Twitter API, 2018')
}

function reload_bargraph(source, emoji){
  var filter_data =[];
  var data = [];
  var source_arg = source;
  var emoji_arg = emoji;

  if(source.length===0){
    source_arg = 'all';
  }
  
  if(emoji.length===0){
    emoji_arg = 'all'
  }

  data = data_transfer(source_arg, emoji_arg);

  for(i=0;i<Math.min(10,data.length);i++){
    filter_data.push(data[i]);
  }
  console.log(filter_data);

  var svg = d3.select('svg');
  var svgContainer = d3.select('#container');

  const margin = 60;
  var width = $('#container').width() - 2 * margin;
  var height = $('#container').height() - 2 * margin;

  var chart = svg.select('.chart');

  var xScale = d3.scaleBand()
      .range([0, width])
      .domain(filter_data.map((marker) => marker.country))
      .padding(0.3)

  var yScale = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(filter_data.map((marker)=>marker.count))*1.1]);

  var makeYLines = () => d3.axisLeft().scale(yScale);

  chart.selectAll('.axisBottom')
    .transition()
    .duration(300)
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale));

  chart.selectAll('.axisLeft')
    .transition()
    .duration(300)
    .call(d3.axisLeft(yScale));

  chart.selectAll('.grid')
      .call(makeYLines()
        .tickSize(-width, 0, 0)
        .tickFormat('')
      );

  var barGroups = chart.selectAll('.barGroup').data(filter_data);
  barGroups.exit().remove();
  barGroups.enter().append('g').attr('class','barGroup');

  barGroups.selectAll('rect').remove();
  barGroups.selectAll('text').remove();

  barGroups = chart.selectAll('.barGroup').data(filter_data);

  //barGroups.selectAll('rect').enter().append('rect').attr('class','bar')

  barGroups.append('rect')
    .attr('class','bar')
    .attr('x', (d)=>xScale(d.country))
    .attr('y', (d)=>yScale(d.count))
    .attr('height', (d)=>height-yScale(d.count))
    .attr('width', xScale.bandwidth())
    .on('mouseover', function(d,i){
        d3.selectAll('.count').attr('opacity',0);
        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', 0.6)
          .attr('x',(a)=>xScale(a.country)-2)
          .attr('width', xScale.bandwidth()+4);

        line = chart.append('line')
          .attr('id','limit')
          .attr('x1',0)
          .attr('y1',yScale(d.count))
          .attr('x2', width)
          .attr('y2',yScale(d.count))

        barGroups.append('text')
          .attr('class', 'divergence')
          .attr('x', (a) => xScale(a.country) + xScale.bandwidth() / 2)
          .attr('y', (a) => yScale(a.count)-5)
          .attr('text-anchor', 'middle')
          .text((a, idx) => {
            var divergence = a.count - d.count
            
            let text = ''
            if (divergence > 0) text += '+'
            text += `${divergence}`

            return idx !== i ? text : '';})
      })
      .on('mouseout',function(){
        d3.selectAll('.count')
          .attr('opacity',1)

        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity',1)
          .attr('x',(a)=>xScale(a.country))
          .attr('width', xScale.bandwidth())

          chart.selectAll('#limit').remove()
          chart.selectAll('.divergence').remove()
      });

  barGroups.append('text').attr('class','count')
    .attr('x', (a)=>xScale(a.country)+xScale.bandwidth()/2)
    .attr('y', (a)=>yScale(a.count)-5)
    .text((a)=>`${a.count}`);
}

function create_emoji_list(){
  var data = markers;
  var emoji_dic_list = [];
  for(i=0;i<data.length;i++){
    for(j=0;j<data[i].emojis.length;j++){
      for(k=0;k<emoji_dic_list.length;k++){
        if(data[i].emojis[j].emoji_type===emoji_dic_list[k].emoji_type){
          emoji_dic_list[k].emoji_count += data[i].emojis[j].emoji_count;
          break;
        }
      }
      if(k>=emoji_dic_list.length){
        var new_emoji_object = {'emoji_type': data[i].emojis[j].emoji_type, 'emoji_count': data[i].emojis[j].emoji_count};
        emoji_dic_list.push(new_emoji_object);
      }
    }
  }

  emoji_dic_list.sort(function(a,b){return b.emoji_count - a.emoji_count;});

  return emoji_dic_list;
}

function load_emoji_selection(){
  var emoji_list = create_emoji_list();
  var container = document.getElementById('emoji_selection');

  for(i=0;i<Math.min(emoji_list.length,80);i++){
    var emoji_type = emoji_list[i].emoji_type;
    var select_div = document.createElement('div');
    select_div.className = 'emoji_cb';

    var selection = document.createElement('input');
    selection.type = 'checkbox';
    selection.name = 'emoji_filter';
    selection.value = emoji_type;
    selection.id = emoji_type;

    var label = document.createElement('label');
    label.htmlFor = emoji_type;
    label.innerHTML = emoji_type;
    
    select_div.appendChild(selection);
    select_div.appendChild(label);
    container.appendChild(select_div);

    emoji_filters[emoji_type] = false;
  }
}