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

            const svg = d3.select("#vis1").append('svg').attr('width', 725).attr('height', 350);
            const width = svg.attr('width');
            const height = svg.attr('height');
            const margins = { top: 5, right: 5, left: 20, bottom: 20 };
            let mapArea = svg.append('g').attr('transform', `translate(${margins.left},${margins.top})`);
            const mapWidth = width - margins.left - margins.right;
            const mapHeight = height - margins.top - margins.bottom;
            // const states = topojson.feature(data, data.location);
            // const stateMesh = topojson.mesh(data, data.location);
            const rangeDate = d3.extent(data, d => d.date)
            console.log(rangeDate)
            const vacMax = d3.max(data, c => c['people_fully_vaccinated']);
            const vacScale = d3.scaleLinear().domain([0, vacMax]).range([0, mapWidth]);
            let dict = {}
            //average vaccination rate
            data.forEach(d => {
                if (!dict.hasOwnProperty(d.location)) {
                    dict[d.location] = {};
                    dict[d.location][d.date] = d.people_fully_vaccinated;
                }
                else {
                    dict[d.location][d.date] = d.people_fully_vaccinated;
                }
            });
            st.features.forEach(e => {
                e.properties["avg_vaccination_rate"] = dict[e.properties.name]
            })
            console.log(dict)

            var projection = d3
                .geoAlbersUsa()
                .fitSize([mapWidth, mapHeight], st);
            let path = d3.geoPath().projection(projection)
            const colors = ["#0A2F51", "#0F596B", "#16837A", "#74C67A", "#ADCF9C"];

            const vals = us.objects.states.geometries.map(function (d) { return d.properties.avg_vaccination_rate; });
            console.log(vals)
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
                .style("stroke-width", 1);
            mapArea.append("path").datum(stMesh)
                .attr("class", "statemesh")
                .attr("d", path)
                .style("stroke", "darkgrey")
                .style("fill", "transparent")
                .style("stroke-width", 1);


            console.log(st.features)

            // function update(time) {
            //     const svg1 = d3.select("#vis1");

            //     const vacMax = d3.max(data, c => c['people_fully_vaccinated']);
            //     const vacScale = d3.scaleLinear().domain([0, vacMax]).range([0, mapWidth]);
            //     //console.log(x)
            //     svg1.selectAll("states").data(st.features)
            //         .join(update => update
            //             .attr("fill", d => colorScale(d.properties.avg_vaccination_rate)),
            //             exit => {
            //                 exit.remove()
            //             }
            //         );

            // }
            //d3.select('#slider').on('input', function () { update(this.value) });

            //update(rangeDate[0]);
        })


    }
    requestData();


}