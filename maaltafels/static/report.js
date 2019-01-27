(function() {

  var charts = {};
  
  function render_chart(name, type, labels, options, datasets) {
    if(name in charts) { charts[name].destroy(); }
    var ctx = document.getElementById(name).getContext("2d");
    charts[name] = new Chart(ctx, {
      type: type,
      data: {
        labels: labels,
        datasets: datasets
      },
      options: options
    });
  }

  function render_evolution() {
    $.getJSON( "/api/results", function(data) {
      data.reverse();
      var labels=[], wrong=[], correct=[], times=[];
      for(var i in data) {
        var d = new Date(data[i]._id);
        labels.push(d.getDate()+"/"+d.getMonth()+1);
        wrong.push(data[i].questions-data[i].correct);
        correct.push(data[i].correct);
        times.push(Math.round(data[i].time/100)/10);
      }
      var datasets = [
        {
          label: "tijd",
          data: times,
          borderWidth: 3,
          yAxisID: "time",
          xAxisId: "time",
          type: "line",
          fill: false,
          borderColor: "#aaaaff",
          backgroundColor: "#aaaaff"
        },
        {
          label: "correct",
          data: correct,
          borderWidth: 1,
          backgroundColor: "#aaffaa"
        },
        {
          label: "fout",
          data: wrong,
          borderWidth: 1,
          backgroundColor: "#ffaaaa"
        }
      ],
      options = {
        scales: {
          xAxes: [
            {
              stacked: true
            },
            {
              id: "time",
              stacked: false
            }
          ],
          yAxes: [
            {
              type: "linear",
              beginAtZero: true,
              stacked: true
            }, {
              id: "time",
              type: "linear",
              position: "right",
              beginAtZero: true,
              min: 0
            }
          ]
        }
      };
      render_chart("evolution", "bar", labels, options, datasets);
    });
  }

  function fromConfig(config) {
    return (config[3] ? config[1] : config[0]) +
           config[2] +
           (config[3] ? config[0] : config[1]);
  }
  
  function render_coverage() {
    $.getJSON( "/api/coverage", function(data) {
      // collect stats
      var stats = {};
      for(var i in data) {
        var q = fromConfig(data[i]._id)
        if(!(q in stats)) { stats[q] = { total: 0, wrong: 0 }; }
        stats[q].total += data[i].total;
        stats[q].wrong += (data[i].total - data[i].correct);
      }
      // determine max total for scaling
      var max_total = 0;
      for(var q in stats) {
        if(stats[q].total > max_total) {
          max_total = stats[q].total;
        }
      }
      // generate bubbles
      var bubbles = {
        "x" : { total: [], wrong: [] },
        ":" : { total: [], wrong: [] }
      };
      for(var i in data) {
        var config = data[i]._id,
            q = fromConfig(config),
            total = stats[q].total / max_total * 20,
            wrong = stats[q].wrong / max_total * 20;
        if(config[3]) {
          bubbles[config[2]].total.push({x: config[1], y: config[0], r: total});
          bubbles[config[2]].wrong.push({x: config[1], y: config[0], r: wrong});
        } else {
          bubbles[config[2]].total.push({x: config[0], y: config[1], r: total});
          bubbles[config[2]].wrong.push({x: config[0], y: config[1], r: wrong});
        }
      }
      // render charts
      render_chart("coverage_m", "bubble", [], {}, [
        {
          label: "fout",
          data: bubbles["x"].wrong,
          backgroundColor: "#ffcccc"
        },
        {
          label: "x",
          data: bubbles["x"].total,
          backgroundColor: "#cccccc"
        }
      ]);
      render_chart("coverage_d", "bubble", [], {}, [
        {
          label: "fout",
          data: bubbles[":"].wrong,
          backgroundColor: "#ffcccc"
        },
        {
          label: ":",
          data: bubbles[":"].total,
          backgroundColor: "#cccccc"
        }
      ]);
    });
  }
  
  render_evolution();
  render_coverage();
})();
