const MATCH_LIMIT_ITERATIONS = 50
const DEFAULT_REGEX = /@MARKER_[A-Z0-9_]+@/g

void function($w, $d) {
    const state = {
        mergeTags: new Map(),
        regex: DEFAULT_REGEX,
        html: '',
        sourceHtml: '',
    }

    /** @param {string} query 
     * @returns {HTMLElement} */
    function getById(query) {
        const elem = $d.querySelector(query)
        if (!elem) throw new Error(`${query} not found`)
        return elem
    }

    /**
     * @param {string[]} labels=[] 
     */
    function initMergeTags(labels) {
        state.mergeTags.clear()
        labels.forEach(l => state.mergeTags.set(l, null))
    }

    /**
     * @param {string} label @param {string} value @param {string} [placeholder='empty']
     * @returns {HTMLElement}
     */
    function createListItem(label, value, placeholder = 'empty') {
        const listItem = $d.createElement('li')
        listItem.innerHTML = `<div>${label}</div> <textarea placeholder=${placeholder}>${value}</textarea>`
        return listItem
    }

    /**
     * @param {HTMLElement} tagList 
     */
    function refreshTags(tagList) {
        const listItems = []
        state.mergeTags.forEach((_, label) => {
            const li = createListItem(label, '')
            state.mergeTags.set(label, li)
            listItems.push(li)
        })
        tagList.replaceChildren(...listItems)
    }

    /**
     * @param {HTMLElement} regexInput 
     */
    function refreshRegex(regexInput) {
        const [s, e] = regexInput.value.trim().split(' ')
        const regex = generatePattern(s, e)
        console.debug('Parsed regex', regex)
        state.regex = regex
    }

    /**
     * @param {HTMLElement} viewSource 
     * @param {HTMLElement} viewRendered 
     */
    function refreshContent(viewSource, viewRendered) {
        viewSource.value = state.html
        viewRendered.innerHTML = state.html
    }

    /**
     * @param {RegExp} regex @param {string} html
     * @returns {string[]} labels
     */
    function extractMergeTags(regex, html) {
        const extracted = new Set()
        let match, iterations = MATCH_LIMIT_ITERATIONS
        while ((match = regex.exec(html)) !== null) {
            extracted.add(match[0])
            if (0 > iterations--) {
                throw new Error('Maximum itetations limit')
            }
        }
        return Array.from(extracted)
    }

    /**
     * @param {string} start 
     * @param {string} end 
     * @returns {RegExp} regex
     */
    function generatePattern(start, end) {
        if (!start || !end) throw new Error('Regex parsing error')
        const escapedStart = start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const escapedEnd = end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        return new RegExp(`${escapedStart}(.*?)${escapedEnd}`, 'gms')
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(
            () => console.log('Copied to clipboard successfully!'),
            (err) => console.error('Failed to copy to clipboard: ', err)
        );
    }

    try {
        const $parseBtn = getById('#tags-control #parse-btn')
        const $execBtn = getById('#tags-control #exec-btn')
        const $regexInput = getById('#tags-control #regex-input')
        const $mergeTagsList = getById('#tags-list ul')

        const $switchBtn = getById('#view-control #switch-btn')
        const $resetBtn = getById('#view-control #reset-btn')
        const $copyBtn = getById('#view-control #copy-btn')
        const $viewSource = getById('#view-content textarea')
        const $viewRendered = getById('#view-content div')


        /* PARSE */
        $parseBtn.onclick = e => {
            try {
                refreshRegex($regexInput)
                initMergeTags(extractMergeTags(state.regex, $viewSource.value))
                state.sourceHtml = $viewSource.value
                state.html = $viewSource.value
                refreshTags($mergeTagsList)
                refreshContent($viewSource, $viewRendered)
            } catch (e) { alert(`Error: ${e.message}`) }
        }

        /* EXEC */
        $execBtn.onclick = e => {
            try {
                state.mergeTags.forEach((li, label) => {
                    const value = li.lastChild.value
                    if (!value) return console.info('Ignore empty', { label })
                    console.log('Replace', { label, value })
                    state.html = state.html.replaceAll(label, value)
                    refreshContent($viewSource, $viewRendered)
                })
            } catch (e) { alert(`Error: ${e.message}`) }
        }

        /* SWITCH */
        $switchBtn.onclick = e => {
            try {
                const [next, show, hide] = {
                    'Source view': ['Rendered view', $viewRendered, $viewSource],
                    'Rendered view': ['Source view', $viewSource, $viewRendered],
                }[$switchBtn.textContent]
                hide.setAttribute('hidden', '');
                show.removeAttribute('hidden');
                $switchBtn.textContent = next
            } catch (e) { alert(`Error: ${e.message}`) }
        }

        /* RESET */
        $resetBtn.onclick = e => {
            try {
                state.html = state.sourceHtml
                refreshContent($viewSource, $viewRendered)
            } catch (e) { alert(`Error: ${e.message}`) }
        }

        /* COPY */
        $copyBtn.onclick = e => {
            try {
                copyToClipboard(state.html)
            } catch (e) { alert(`Error: ${e.message}`) }
        }
    } catch (e) {
        alert(`Error: ${e.message}`)
    }
}(window, document)
