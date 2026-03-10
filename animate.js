/* =============================================================
   Cogitator Landing Page — Animations
   - Mouse-responsive constellation particle system
   - Scroll-triggered reveals
   - Typing effect for screenshot mock
   ============================================================= */

(function () {
    'use strict';

    var motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ----- Constellation ----- */

    var canvas = document.getElementById('constellation');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var NODE_COUNT = 55;
    var CONNECT_DIST = 150;
    var MOUSE_DIST = 200;
    var NODE_RADIUS = 1.8;
    var SPEED = 0.12;

    /* Colors — warm orange tint to match accent */
    var LINE_COLOR_R = 212, LINE_COLOR_G = 85, LINE_COLOR_B = 10;  /* --accent #d4550a */
    var NODE_COLOR = 'rgba(86, 84, 79, 0.45)';
    var NODE_COLOR_ACTIVE = 'rgba(212, 85, 10, 0.6)';

    var nodes = [];
    var mouse = { x: -1000, y: -1000 };
    var w, h, dpr, animId;
    var scrollY = 0;
    var heroHeight = 0;

    function resize() {
        dpr = window.devicePixelRatio || 1;
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var hero = document.querySelector('.hero');
        if (hero) heroHeight = hero.offsetHeight;
    }

    function createNodes() {
        nodes = [];
        for (var i = 0; i < NODE_COUNT; i++) {
            nodes.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * SPEED * 2,
                vy: (Math.random() - 0.5) * SPEED * 2,
                baseSpeed: SPEED + Math.random() * SPEED * 0.5
            });
        }
    }

    function tick() {
        /* Fade out as user scrolls past hero */
        var fade = heroHeight > 0 ? Math.max(0, 1 - scrollY / (heroHeight * 0.7)) : 1;
        canvas.style.opacity = fade * 0.55;

        if (fade < 0.02) {
            animId = requestAnimationFrame(tick);
            return;
        }

        ctx.clearRect(0, 0, w, h);

        /* Move nodes */
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];

            /* Gentle mouse repulsion */
            var dmx = n.x - mouse.x;
            var dmy = n.y - mouse.y;
            var dmd = Math.sqrt(dmx * dmx + dmy * dmy);
            if (dmd < MOUSE_DIST && dmd > 0) {
                var force = (1 - dmd / MOUSE_DIST) * 0.3;
                n.vx += (dmx / dmd) * force;
                n.vy += (dmy / dmd) * force;
            }

            /* Dampen velocity */
            n.vx *= 0.98;
            n.vy *= 0.98;

            /* Maintain minimum drift */
            var speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
            if (speed < n.baseSpeed * 0.5) {
                n.vx += (Math.random() - 0.5) * 0.02;
                n.vy += (Math.random() - 0.5) * 0.02;
            }

            n.x += n.vx;
            n.y += n.vy;

            /* Wrap */
            if (n.x < -20) n.x = w + 20;
            if (n.x > w + 20) n.x = -20;
            if (n.y < -20) n.y = h + 20;
            if (n.y > h + 20) n.y = -20;
        }

        /* Draw connections */
        for (var i = 0; i < nodes.length; i++) {
            for (var j = i + 1; j < nodes.length; j++) {
                var dx = nodes[i].x - nodes[j].x;
                var dy = nodes[i].y - nodes[j].y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECT_DIST) {
                    var alpha = (1 - dist / CONNECT_DIST) * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = 'rgba(' + LINE_COLOR_R + ',' + LINE_COLOR_G + ',' + LINE_COLOR_B + ',' + alpha + ')';
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }

        /* Draw mouse connections (brighter) */
        if (mouse.x > -500) {
            for (var i = 0; i < nodes.length; i++) {
                var dmx = nodes[i].x - mouse.x;
                var dmy = nodes[i].y - mouse.y;
                var dmd = Math.sqrt(dmx * dmx + dmy * dmy);
                if (dmd < MOUSE_DIST) {
                    var alpha = (1 - dmd / MOUSE_DIST) * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = 'rgba(' + LINE_COLOR_R + ',' + LINE_COLOR_G + ',' + LINE_COLOR_B + ',' + alpha + ')';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        /* Draw nodes */
        for (var i = 0; i < nodes.length; i++) {
            var dmx = nodes[i].x - mouse.x;
            var dmy = nodes[i].y - mouse.y;
            var nearMouse = Math.sqrt(dmx * dmx + dmy * dmy) < MOUSE_DIST;

            ctx.beginPath();
            ctx.arc(nodes[i].x, nodes[i].y, nearMouse ? NODE_RADIUS * 1.5 : NODE_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = nearMouse ? NODE_COLOR_ACTIVE : NODE_COLOR;
            ctx.fill();
        }

        animId = requestAnimationFrame(tick);
    }

    /* Mouse tracking */
    document.addEventListener('mousemove', function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    document.addEventListener('mouseleave', function () {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    /* Scroll tracking */
    window.addEventListener('scroll', function () {
        scrollY = window.pageYOffset || document.documentElement.scrollTop;
    }, { passive: true });

    /* Pause when tab not visible */
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            cancelAnimationFrame(animId);
        } else {
            animId = requestAnimationFrame(tick);
        }
    });

    if (motionOk) {
        resize();
        createNodes();
        tick();
        window.addEventListener('resize', function () {
            resize();
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].x > w) nodes[i].x = Math.random() * w;
                if (nodes[i].y > h) nodes[i].y = Math.random() * h;
            }
        });
    } else {
        canvas.style.display = 'none';
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
            .alphaDecay(0.008)
            .alphaMin(0.005)
            .velocityDecay(0.55);

        /* Gentle drift: periodically nudge alpha so the graph never fully settles */
        driftTimer = d3.interval(function () {
            if (simulation) {
                /* Tiny random velocity perturbation on each node */
                graphNodes.forEach(function (n) {
                    n.vx += (Math.random() - 0.5) * 0.3;
                    n.vy += (Math.random() - 0.5) * 0.3;
                });
                simulation.alpha(0.03).restart();
            }
        }, 3000);

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
