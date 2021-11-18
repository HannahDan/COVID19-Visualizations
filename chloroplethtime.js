function chgraphtime() {

    const requestData = async function () {
        const us = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
        // console.log(us);
        const st = topojson.feature(us, us.objects.states);
        const stMesh = topojson.mesh(us, us.objects.states);
        const nation = topojson.mesh(us, us.objects.nation);

        d3.csv('us_state_vaccinations.csv', d3.autoType).then((data) => {

            data = data.filter(d => d['date'] != null && d['people_fully_vaccinated'] != null && d['location'] != null);
            console.log(data)
            // csv -> {'Alabama': {
            //     'date1': {values},
            //     'date2': {}
            // }}

            const svg = d3.select("#vis1").append('svg').style("margin", "auto").attr('width', 750).attr('height', 500);
            const width = svg.attr('width');
            const height = svg.attr('height');
            const margins = { top: 5, right: 5, left: 20, bottom: 20 };
            let mapArea = svg.append('g').attr('transform', `translate(${margins.left},${margins.top})`);
            const mapWidth = width - margins.left - margins.right;
            const mapHeight = height - margins.top - margins.bottom;



            const vacMax = d3.max(data, c => c['people_fully_vaccinated']);
            const vacScale = d3.scaleLinear().domain([0, vacMax]).range([0, mapWidth]);
            let dict = {}
            //average vaccination rate
            data.forEach((d) => {
                if (!dict.hasOwnProperty(d.location)) {
                    if (d.location == "New York State") {
                        d.location = "New York";
                    }
                    dict[d.location] = {};
                    dict[d.location][`${d.date.getMonth()}/${d.date.getDate()}`] =
                        d.people_fully_vaccinated;
                } else {
                    dict[d.location][`${d.date.getMonth()}/${d.date.getDate()}`] =
                        d.people_fully_vaccinated;
                }
            });
            st.features.forEach(e => {
                e.properties["avg_vaccination_rate"] = dict[e.properties.name]
            })
            const rangeDate = d3.extent(
                data,
                (d) =>
                    new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate())
            );


            console.log(rangeDate[1]);

            var projection = d3
                .geoAlbersUsa()
                .fitSize([mapWidth, mapHeight], st);
            let path = d3.geoPath().projection(projection)
            const colors = ["#ADCF9C", "#74C67A", "#16837A", "#0F596B", "#0A2F51"];
            console.log(us.objects.states.geometries);
            const vals = data.map((d) => d.people_fully_vaccinated);
            let colorScale = d3.scaleQuantile().domain(vals).range(colors);
            mapArea.selectAll("states").data(st.features)
                .attr("class", "states")
                .join("path")
                .attr("d", path)
                .attr("fill", d => colorScale(d.properties.avg_vaccination_rate));
            mapArea.append("path").datum(stMesh)
                .attr("class", "zipmesh")
                .attr("d", path)
                .style("stroke", "white")
                .style("fill", "transparent")
                .style("stroke-width", 2);
            mapArea.append("path").datum(stMesh)
                .attr("class", "statemesh")
                .attr("d", path)
                .style("stroke", "darkgrey")
                .style("fill", "transparent")
                .style("stroke-width", 1);

            function update(time) {
                const dateObj = new Date(time * 1000);
                const date = `${dateObj.getMonth()}/${dateObj.getDate()}`;
                mapArea
                    .selectAll('path.states')
                    .data(st.features)
                    .join('path')
                    .attr('class', 'states')
                    .attr('d', path)
                    .attr('fill', (d) => {
                        return d.properties.avg_vaccination_rate === undefined ||
                            d.properties.avg_vaccination_rate[date] === undefined
                            ? 'lightgrey'
                            : colorScale(d.properties.avg_vaccination_rate[date]);
                    });
            }
            const list = d3.select("#list");
            colors.forEach((d) => {
                if (d != "#ADCF9C") {
                    list.append("li").text("Up to " + Math.floor(colorScale.invertExtent(d)[1]) + " vaccinations").style('color', d).attr("class", "bullet-text");
                }
            });
            list.append("li").text("No information for date").style('color', 'grey');
            d3.select('#slider')
                .attr('min', rangeDate[0].getTime() / 1000)
                .attr('max', rangeDate[1].getTime() / 1000)
                .on('input', function () {
                    update(this.value);
                });
            update(rangeDate[0].getTime() / 1000);


        })


    }
    requestData();


}
