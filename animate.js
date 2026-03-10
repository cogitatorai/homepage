/* =============================================================
   Cogitator Landing Page — Animations
   - Background graph (D3 force, tree structure, no cycles)
   - Scroll-triggered reveals
   ============================================================= */

(function () {
    'use strict';

    var motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ----- Background graph ----- */

    var svgEl = document.getElementById('bg-graph');
    var hasD3 = typeof d3 !== 'undefined';

    var NODE_COLOR = '#dddbd6';
    var EDGE_COLOR = '#dddbd6';
    var NODE_COUNT = 30;
    var simulation = null;

    function buildBgGraph() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        if (w === 0 || h === 0) return;

        var svg = d3.select(svgEl);
        svg.attr('width', w).attr('height', h);
        svg.selectAll('*').remove();

        /* Dot grid pattern */
        var defs = svg.append('defs');
        var dotPattern = defs.append('pattern')
            .attr('id', 'bg-dots')
            .attr('width', 24).attr('height', 24)
            .attr('patternUnits', 'userSpaceOnUse');
        dotPattern.append('circle')
            .attr('cx', 12).attr('cy', 12).attr('r', 1)
            .attr('fill', '#dddbd6');
        svg.append('rect')
            .attr('width', w).attr('height', h)
            .attr('fill', 'url(#bg-dots)');

        /* Generate nodes spread across viewport */
        var nodes = [];
        for (var i = 0; i < NODE_COUNT; i++) {
            nodes.push({
                id: i,
                x: Math.random() * w,
                y: Math.random() * h,
                r: 2 + Math.random() * 2.5
            });
        }

        /*
         * Build a spanning tree: each node (except root) connects to exactly
         * one parent. This guarantees NO closed loops.
         * Then add a few dangling "leaf" edges that branch off but never close.
         */
        var edges = [];
        var connected = [0];
        var unconnected = [];
        for (var i = 1; i < NODE_COUNT; i++) unconnected.push(i);

        /* Shuffle unconnected for randomness */
        for (var i = unconnected.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = unconnected[i];
            unconnected[i] = unconnected[j];
            unconnected[j] = tmp;
        }

        /* Connect each node to a random already-connected node (spanning tree) */
        while (unconnected.length > 0) {
            var nodeIdx = unconnected.pop();
            var parentIdx = connected[Math.floor(Math.random() * connected.length)];
            edges.push({ source: parentIdx, target: nodeIdx });
            connected.push(nodeIdx);
        }

        /* Force simulation */
        simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(edges).id(function (d) { return d.id; }).distance(200).strength(0.2))
            .force('charge', d3.forceManyBody().strength(-250))
            .force('x', d3.forceX(w / 2).strength(0.015))
            .force('y', d3.forceY(h / 2).strength(0.015))
            .force('collision', d3.forceCollide(40))
            .force('bounds', function () {
                var pad = 30;
                for (var i = 0; i < nodes.length; i++) {
                    var n = nodes[i];
                    if (n.x < pad) { n.x = pad; n.vx = Math.abs(n.vx) * 0.5; }
                    if (n.x > w - pad) { n.x = w - pad; n.vx = -Math.abs(n.vx) * 0.5; }
                    if (n.y < pad) { n.y = pad; n.vy = Math.abs(n.vy) * 0.5; }
                    if (n.y > h - pad) { n.y = h - pad; n.vy = -Math.abs(n.vy) * 0.5; }
                }
            })
            .alphaDecay(0.005)
            .alphaMin(0.001)
            .velocityDecay(0.6);

        var g = svg.append('g');

        /* Edges */
        var link = g.append('g').selectAll('line')
            .data(edges).join('line')
            .attr('stroke', EDGE_COLOR)
            .attr('stroke-opacity', 0.5)
            .attr('stroke-width', 1);

        /* Nodes */
        var node = g.append('g').selectAll('circle')
            .data(nodes).join('circle')
            .attr('r', function (d) { return d.r; })
            .attr('fill', NODE_COLOR)
            .attr('fill-opacity', 0.4);

        /* Tick */
        simulation.on('tick', function () {
            link
                .attr('x1', function (d) { return d.source.x; })
                .attr('y1', function (d) { return d.source.y; })
                .attr('x2', function (d) { return d.target.x; })
                .attr('y2', function (d) { return d.target.y; });
            node
                .attr('cx', function (d) { return d.x; })
                .attr('cy', function (d) { return d.y; });
        });

        /* Gentle drift */
        d3.interval(function () {
            if (simulation) {
                nodes.forEach(function (n) {
                    n.vx += (Math.random() - 0.5) * 0.3;
                    n.vy += (Math.random() - 0.5) * 0.3;
                });
                simulation.alpha(0.05).restart();
            }
        }, 2000);
    }

    if (svgEl && hasD3) {
        buildBgGraph();

        if (!motionOk && simulation) {
            /* Run simulation to stable state, then freeze */
            for (var i = 0; i < 300; i++) simulation.tick();
            simulation.stop();
        }

        window.addEventListener('resize', function () {
            if (simulation) simulation.stop();
            simulation = null;
            buildBgGraph();
            if (!motionOk && simulation) {
                for (var i = 0; i < 300; i++) simulation.tick();
                simulation.stop();
            }
        });
    }

    /* ----- Scroll reveals ----- */

    var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');

    if (!motionOk) {
        revealEls.forEach(function (el) { el.classList.add('visible'); });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px'
    });

    revealEls.forEach(function (el) {
        observer.observe(el);
    });

})();

/* =============================================================
   Living Memory Graph — D3 force-directed SVG
   Matches the app's MemoryGraph component, adapted for light theme
   ============================================================= */
(function () {
    'use strict';

    var container = document.getElementById('memory-graph-container');
    var svgEl = document.getElementById('memory-graph');
    var section = document.getElementById('memory-graph-section');
    if (!container || !svgEl || !section || typeof d3 === 'undefined') return;

    var motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Type accent colors (same as app) */
    var TYPE_ACCENT = {
        fact: '#60a5fa',
        preference: '#a78bfa',
        pattern: '#2dd4bf',
        skill: '#f97316',
        episode: '#4ade80',
        task_knowledge: '#fbbf24'
    };

    var EDGE_COLOR = '#a8a29e'; /* warm gray for light theme */

    /*
     * Memory data: designed as coherent clusters a real agent would build.
     *
     * Morning routine:  Coffee first -> Oat milk latte, Morning jog -> Standup
     * Work:             Standup -> Marcus, Team lead, Weekly review -> Weekly report
     * Travel:           Tokyo trip -> Sarah, Cafe Mori, Flight alerts
     * Family:           Mom -> Sarah, Dr. Chen
     * Automation:       Morning briefing -> HN digest, Deploy monitor
     * Home:             Home studio, Read before bed
     */
    var MEMORIES = [
        /* Morning routine cluster */
        { id: 'coffee',     title: 'Coffee first',       type: 'pattern' },
        { id: 'oatmilk',    title: 'Oat milk latte',     type: 'preference' },
        { id: 'jog',        title: 'Morning jog',        type: 'pattern' },
        { id: 'standup',    title: 'Standup at 9am',     type: 'pattern' },

        /* Work cluster */
        { id: 'marcus',     title: 'Marcus',             type: 'fact' },
        { id: 'teamlead',   title: 'Team lead',          type: 'fact' },
        { id: 'review',     title: 'Weekly review',      type: 'pattern' },
        { id: 'report',     title: 'Weekly report',      type: 'task_knowledge' },
        { id: 'lisbon',     title: 'Lisbon office',      type: 'fact' },
        { id: 'deploy',     title: 'Deploy monitor',     type: 'task_knowledge' },

        /* Automation cluster */
        { id: 'briefing',   title: 'Morning briefing',   type: 'task_knowledge' },
        { id: 'hn',         title: 'HN digest',          type: 'skill' },
        { id: 'expenses',   title: 'Expense tracker',    type: 'skill' },

        /* Family and travel cluster */
        { id: 'sarah',      title: 'Sarah',              type: 'fact' },
        { id: 'mom',        title: 'Mom',                type: 'fact' },
        { id: 'drchen',     title: 'Dr. Chen',           type: 'fact' },
        { id: 'tokyo',      title: 'Tokyo trip',         type: 'episode' },
        { id: 'cafemori',   title: 'Cafe Mori',          type: 'episode' },
        { id: 'flights',    title: 'Flight alerts',      type: 'skill' },

        /* Home cluster */
        { id: 'home',       title: 'Home studio',        type: 'fact' },
        { id: 'reading',    title: 'Read before bed',    type: 'pattern' },
        { id: 'darkmode',   title: 'Dark mode',          type: 'preference' },
        { id: 'markdown',   title: 'Markdown format',    type: 'preference' }
    ];

    var RELATIONS = [
        /* Morning routine: coffee -> oat milk (how they take it), coffee -> jog (sequence), jog -> standup */
        { source: 'oatmilk',   target: 'coffee',    relation: 'part_of' },
        { source: 'coffee',    target: 'jog',        relation: 'followed_by' },
        { source: 'jog',       target: 'standup',    relation: 'followed_by' },

        /* Morning briefing runs before standup, uses HN digest */
        { source: 'briefing',  target: 'standup',    relation: 'prepares' },
        { source: 'briefing',  target: 'hn',         relation: 'uses' },

        /* Work: standup involves people, review produces report */
        { source: 'standup',   target: 'marcus',     relation: 'involves' },
        { source: 'standup',   target: 'teamlead',   relation: 'involves' },
        { source: 'review',    target: 'standup',     relation: 'follows' },
        { source: 'review',    target: 'report',      relation: 'produces' },
        { source: 'report',    target: 'expenses',    relation: 'uses' },
        { source: 'marcus',    target: 'lisbon',      relation: 'works_at' },
        { source: 'deploy',    target: 'teamlead',    relation: 'notifies' },

        /* Family: mom and sarah are family, dr. chen is mom's doctor */
        { source: 'sarah',     target: 'mom',         relation: 'family' },
        { source: 'drchen',    target: 'mom',         relation: 'doctor_of' },

        /* Travel: tokyo trip with sarah, found cafe mori there, flight alerts for trip */
        { source: 'tokyo',     target: 'sarah',       relation: 'with' },
        { source: 'cafemori',  target: 'tokyo',       relation: 'part_of' },
        { source: 'flights',   target: 'tokyo',       relation: 'monitors' },
        { source: 'tokyo',     target: 'lisbon',      relation: 'departs_from' },

        /* Home: reading habit at home, prefers dark mode for reading */
        { source: 'reading',   target: 'home',        relation: 'location' },
        { source: 'darkmode',  target: 'reading',     relation: 'preferred_for' },

        /* Markdown preference connects to reports */
        { source: 'markdown',  target: 'report',      relation: 'format_for' }
    ];

    var simulation = null;
    var driftTimer = null;
    var built = false;

    function accentFor(type) {
        return TYPE_ACCENT[type] || '#78716c';
    }

    function buildGraph() {
        var width = container.clientWidth;
        var height = container.clientHeight;
        if (width === 0 || height === 0) return;

        var svg = d3.select(svgEl);
        svg.attr('width', width).attr('height', height);
        svg.selectAll('*').remove();
        d3.select(container).selectAll('.mg-tooltip').remove();

        var graphNodes = MEMORIES.map(function (m, i) {
            var angle = (i / MEMORIES.length) * Math.PI * 2;
            var r = 60 + Math.random() * 80;
            return Object.assign({}, m, {
                x: width / 2 + Math.cos(angle) * r,
                y: height / 2 + Math.sin(angle) * r
            });
        });
        var graphLinks = RELATIONS.map(function (r) {
            return { source: r.source, target: r.target, relation: r.relation };
        });

        /* Defs: dot grid + arrow marker */
        var defs = svg.append('defs');

        var grid = defs.append('pattern')
            .attr('id', 'mg-grid-dots')
            .attr('width', 24).attr('height', 24)
            .attr('patternUnits', 'userSpaceOnUse');
        grid.append('circle')
            .attr('cx', 12).attr('cy', 12).attr('r', 0.5)
            .attr('fill', '#c8c6c1');

        defs.append('marker')
            .attr('id', 'mg-arrow')
            .attr('viewBox', '0 -4 8 8')
            .attr('refX', 24).attr('refY', 0)
            .attr('markerWidth', 5).attr('markerHeight', 5)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-3L8,0L0,3')
            .attr('fill', '#a8a29e');

        /* Background dot grid */
        svg.append('rect')
            .attr('width', width).attr('height', height)
            .attr('fill', 'url(#mg-grid-dots)');

        var g = svg.append('g');

        /* Edges */
        var link = g.append('g').selectAll('line')
            .data(graphLinks).join('line')
            .attr('stroke', EDGE_COLOR)
            .attr('stroke-opacity', 0.5)
            .attr('stroke-width', 1)
            .attr('marker-end', 'url(#mg-arrow)');

        /* Edge labels (hidden until hover) */
        var edgeLabel = g.append('g').selectAll('text')
            .data(graphLinks).join('text')
            .attr('font-size', 10)
            .attr('font-family', '"Rajdhani", system-ui, sans-serif')
            .attr('letter-spacing', '0.05em')
            .attr('fill', '#78716c')
            .attr('fill-opacity', 0)
            .attr('text-anchor', 'middle')
            .attr('dy', -4)
            .text(function (d) { return d.relation.replace(/_/g, ' ').toUpperCase(); });

        /* Node groups */
        var node = g.append('g').selectAll('g')
            .data(graphNodes).join('g')
            .style('cursor', 'default');

        /* Outer ring */
        node.append('circle')
            .attr('r', 14)
            .attr('fill', 'none')
            .attr('stroke', function (d) { return accentFor(d.type); })
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.25);

        /* Main circle */
        node.append('circle')
            .attr('r', 12)
            .attr('fill', function (d) {
                var c = d3.color(accentFor(d.type));
                return c ? c.copy({ opacity: 0.1 }).formatRgb() : '#e7e5e4';
            })
            .attr('stroke', '#c8c6c1')
            .attr('stroke-width', 1)
            .attr('class', 'mg-main-circle');

        /* Inner dot */
        node.append('circle')
            .attr('r', 3)
            .attr('fill', function (d) { return accentFor(d.type); })
            .attr('fill-opacity', 0.7);

        /* Labels */
        node.append('text')
            .attr('dy', 26)
            .attr('text-anchor', 'middle')
            .attr('font-size', 11)
            .attr('font-family', '"Rajdhani", system-ui, sans-serif')
            .attr('letter-spacing', '0.1em')
            .attr('fill', '#78716c')
            .attr('pointer-events', 'none')
            .text(function (d) {
                var t = d.title.length > 18 ? d.title.slice(0, 16) + '..' : d.title;
                return t.toUpperCase();
            });

        /* Tooltip */
        var tooltip = d3.select(container)
            .append('div').attr('class', 'mg-tooltip');

        /* Hover interactions */
        node.on('mouseenter', function (event, d) {
            var accent = accentFor(d.type);

            link.attr('stroke-opacity', function (l) {
                var s = typeof l.source === 'object' ? l.source.id : l.source;
                var t = typeof l.target === 'object' ? l.target.id : l.target;
                return s === d.id || t === d.id ? 0.8 : 0.1;
            }).attr('stroke', function (l) {
                var s = typeof l.source === 'object' ? l.source.id : l.source;
                var t = typeof l.target === 'object' ? l.target.id : l.target;
                return s === d.id || t === d.id ? accent : EDGE_COLOR;
            });

            edgeLabel.attr('fill-opacity', function (l) {
                var s = typeof l.source === 'object' ? l.source.id : l.source;
                var t = typeof l.target === 'object' ? l.target.id : l.target;
                return s === d.id || t === d.id ? 0.8 : 0;
            });

            d3.select(this).select('.mg-main-circle')
                .attr('fill', function () {
                    var c = d3.color(accent);
                    return c ? c.copy({ opacity: 0.22 }).formatRgb() : '#d6d3d1';
                })
                .attr('stroke', accent)
                .attr('stroke-opacity', 0.5);

            tooltip.style('opacity', '1')
                .html(
                    '<div style="color:#242220;font-weight:700;margin-bottom:3px;text-transform:uppercase;letter-spacing:0.1em;font-size:12px">' + d.title + '</div>' +
                    '<div style="color:' + accent + ';font-size:11px;text-transform:uppercase;letter-spacing:0.15em">' + d.type.replace(/_/g, ' ') + '</div>'
                );

            var rect = container.getBoundingClientRect();
            tooltip
                .style('left', (event.clientX - rect.left + 14) + 'px')
                .style('top', (event.clientY - rect.top - 14) + 'px');
        })
        .on('mousemove', function (event) {
            var rect = container.getBoundingClientRect();
            tooltip
                .style('left', (event.clientX - rect.left + 14) + 'px')
                .style('top', (event.clientY - rect.top - 14) + 'px');
        })
        .on('mouseleave', function (event, d) {
            link.attr('stroke-opacity', 0.5).attr('stroke', EDGE_COLOR);
            edgeLabel.attr('fill-opacity', 0);
            tooltip.style('opacity', '0');

            d3.select(this).select('.mg-main-circle')
                .attr('fill', function () {
                    var c = d3.color(accentFor(d.type));
                    return c ? c.copy({ opacity: 0.1 }).formatRgb() : '#e7e5e4';
                })
                .attr('stroke', '#c8c6c1')
                .attr('stroke-opacity', 1);
        });

        /* Bounding force: keep nodes inside the SVG with padding for labels */
        var PAD = 40;
        function forceBounds() {
            for (var i = 0; i < graphNodes.length; i++) {
                var n = graphNodes[i];
                if (n.x < PAD) { n.x = PAD; n.vx = Math.abs(n.vx) * 0.5; }
                if (n.x > width - PAD) { n.x = width - PAD; n.vx = -Math.abs(n.vx) * 0.5; }
                if (n.y < PAD) { n.y = PAD; n.vy = Math.abs(n.vy) * 0.5; }
                if (n.y > height - PAD) { n.y = height - PAD; n.vy = -Math.abs(n.vy) * 0.5; }
            }
        }

        /* Force simulation */
        simulation = d3.forceSimulation(graphNodes)
            .force('link', d3.forceLink(graphLinks).id(function (d) { return d.id; }).distance(100))
            .force('charge', d3.forceManyBody().strength(-200))
            .force('x', d3.forceX(width / 2).strength(0.04))
            .force('y', d3.forceY(height / 2).strength(0.06))
            .force('collision', d3.forceCollide(36))
            .force('bounds', forceBounds)
            .alphaDecay(0.005)
            .alphaMin(0.001)
            .velocityDecay(0.6);

        /* Gentle drift: periodically nudge alpha so the graph never fully settles */
        driftTimer = d3.interval(function () {
            if (simulation) {
                /* Tiny random velocity perturbation on each node */
                graphNodes.forEach(function (n) {
                    n.vx += (Math.random() - 0.5) * 0.3;
                    n.vy += (Math.random() - 0.5) * 0.3;
                });
                simulation.alpha(0.05).restart();
            }
        }, 2000);

        simulation.on('tick', function () {
            link
                .attr('x1', function (d) { return d.source.x; })
                .attr('y1', function (d) { return d.source.y; })
                .attr('x2', function (d) { return d.target.x; })
                .attr('y2', function (d) { return d.target.y; });

            edgeLabel
                .attr('x', function (d) { return (d.source.x + d.target.x) / 2; })
                .attr('y', function (d) { return (d.source.y + d.target.y) / 2; });

            node.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
        });

        built = true;
    }

    /* Build immediately on load */
    if (motionOk) {
        buildGraph();
    } else {
        buildGraph();
        if (simulation) {
            simulation.alpha(0).stop();
            for (var i = 0; i < 300; i++) simulation.tick();
            simulation.on('tick')();
        }
    }

    window.addEventListener('resize', function () {
        if (built) {
            if (driftTimer) { driftTimer.stop(); driftTimer = null; }
            if (simulation) simulation.stop();
            simulation = null;
            built = false;
            buildGraph();
        }
    });
})();

/* =============================================================
   Contact form — collapsible, wired for Google Sheets
   ============================================================= */
(function () {
    'use strict';

    var toggle = document.getElementById('contact-toggle');
    var formWrap = document.getElementById('contact-form');
    var form = document.getElementById('contact-form-el');
    var status = document.getElementById('contact-status');
    if (!toggle || !formWrap || !form) return;

    /* Toggle open/close */
    toggle.addEventListener('click', function () {
        var expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        formWrap.hidden = expanded;
        if (!expanded) {
            setTimeout(function () {
                document.querySelector('.copyright').scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 50);
        }
    });

    var WORKER_URL = 'https://cogitator-contact.andrei-sambra.workers.dev';

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        status.textContent = 'Sending...';
        status.className = 'contact-status';

        fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: form.elements.name.value,
                email: form.elements.email.value,
                message: form.elements.message.value,
            }),
        })
        .then(function (res) {
            if (!res.ok) throw new Error('send failed');
            status.textContent = 'Message sent. Thank you!';
            status.className = 'contact-status success';
            form.reset();
        })
        .catch(function () {
            status.textContent = 'Could not send. Please try again.';
            status.className = 'contact-status error';
        })
        .finally(function () {
            btn.disabled = false;
        });
    });
})();
