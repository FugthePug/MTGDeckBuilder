    const generateBtn = document.getElementById('generateBtn');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const loadingDiv = document.getElementById('loading');
    const colorButtons = document.querySelectorAll('.color-btn');

    let selectedColors = [];

    function updateButtonState() {
      generateBtn.disabled = selectedColors.length === 0;
    }

    colorButtons.forEach(button => {
      button.addEventListener('click', () => {
        const color = button.dataset.color;

        // Handle colorless special rules
        if (color === 'c') {
          selectedColors = ['c'];

          colorButtons.forEach(btn => {
            btn.classList.remove('active');
          });

          button.classList.add('active');
          updateButtonState();
          return;
        }

        // Deselect colorless when selecting colors
        selectedColors = selectedColors.filter(c => c !== 'c');

        const colorlessButton = document.querySelector('[data-color="c"]');
        colorlessButton.classList.remove('active');

        // Toggle selected colors
        if (selectedColors.includes(color)) {
          selectedColors = selectedColors.filter(c => c !== color);
          button.classList.remove('active');
        } else {
          selectedColors.push(color);
          button.classList.add('active');
        }
        updateButtonState();
      });
    });

    // Initially disable the button
    updateButtonState();

    generateBtn.addEventListener('click', async () => {
      const userColors = selectedColors.sort().join('');

      resultDiv.innerHTML = '';
      errorDiv.textContent = '';
      loadingDiv.textContent = '';

      loadingDiv.textContent = 'Fetching random commander...';

      try {
        const requestURL =
          `https://api.scryfall.com/cards/random?q=is%3Acommander+id%3D${userColors}`;

        const response = await fetch(requestURL);

        if (!response.ok) {
          throw new Error('Failed to fetch commander data.');
        }

        const commander = await response.json();

        loadingDiv.textContent = '';

        const imageUrl = commander.image_uris
          ? commander.image_uris.normal
          : commander.card_faces?.[0]?.image_uris?.normal;

        resultDiv.innerHTML = `
          <h2><a href="${commander.scryfall_uri}" target="_blank">${commander.name}</a></h2>
          <p><strong>Mana Cost:</strong> ${commander.mana_cost || 'N/A'}</p>
          <p><strong>Type:</strong> ${commander.type_line}</p>
          <p><strong>Oracle Text:</strong></p>
          <p>${commander.oracle_text || 'No text available.'}</p>
          ${imageUrl ? `<img src="${imageUrl}" alt="${commander.name}">` : ''}
          <button id="clearCommanderBtn" class="secondary-btn danger">Clear Commander</button>
          <div class="deck-controls">
            <h3>Deck Builder</h3>
            <div id="cardCount">Current Card Count: 99/99</div>
            <div class="deck-grid">
              <label>Creatures: <input type="number" id="creatures" min="0" value="30"></label>
              <label>Artifacts: <input type="number" id="artifacts" min="0" value="10"></label>
              <label>Lands: <input type="number" id="lands" min="0" value="18"></label>
              <label>Basic Lands: <input type="number" id="basicLands" min="0" value="20"></label>
              <label>Instants: <input type="number" id="instants" min="0" value="5"></label>
              <label>Sorceries: <input type="number" id="sorceries" min="0" value="16"></label>
              <label>Planeswalkers: <input type="number" id="planeswalkers" min="0" value="0"></label>
            </div>
            <div class="deck-action-row">
              <button id="buildDeckBtn">Build a Deck!</button>
            </div>
            <div id="deckResult"></div>
            <div class="clear-deck-row hidden">
              <button id="clearDeckBtn" class="secondary-btn danger" type="button">Clear Deck</button>
            </div>
          </div>
        `;

        // Add event listeners for inputs
        const inputs = document.querySelectorAll('.deck-controls input');
        inputs.forEach(input => input.addEventListener('input', checkSum));

        // Initial check
        checkSum();

        function checkSum() {
          const sum = Array.from(inputs).reduce((acc, input) => acc + parseInt(input.value || 0), 0);
          document.getElementById('cardCount').textContent = `Current Card Count: ${sum}/99`;
          document.getElementById('buildDeckBtn').disabled = sum !== 99;
        }

        // Add event listeners for build and clear buttons
        document.getElementById('buildDeckBtn').addEventListener('click', () => buildDeck(userColors));
        document.getElementById('clearDeckBtn').addEventListener('click', clearDeck);
        document.getElementById('clearCommanderBtn').addEventListener('click', clearCommander);

      } catch (error) {
        loadingDiv.textContent = '';
        errorDiv.textContent = `Error: ${error.message}`;
      }
    });

    async function buildDeck(commanderColors) {
      const creatures = parseInt(document.getElementById('creatures').value);
      const artifacts = parseInt(document.getElementById('artifacts').value);
      const lands = parseInt(document.getElementById('lands').value);
      const basicLands = parseInt(document.getElementById('basicLands').value);
      const instants = parseInt(document.getElementById('instants').value);
      const sorceries = parseInt(document.getElementById('sorceries').value);
      const planeswalkers = parseInt(document.getElementById('planeswalkers').value);

      const deckResultDiv = document.getElementById('deckResult');
      deckResultDiv.innerHTML = 'Building deck. This will take at least one minute...';

      const deckControls = document.querySelectorAll('.deck-controls input, #buildDeckBtn');
      deckControls.forEach(element => element.disabled = true);

      const creaturesDeck = [];
      const artifactsDeck = [];
      const landsDeck = [];
      const instantsDeck = [];
      const sorceriesDeck = [];
      const planeswalkersDeck = [];
      let basicLandCount = basicLands;

      function selectUniqueCards(sourceCards, requestedCount) {
        const selected = [];
        const seen = new Set();
        const shuffled = [...sourceCards].sort(() => Math.random() - 0.5);

        for (const card of shuffled) {
          if (!seen.has(card.name)) {
            seen.add(card.name);
            selected.push(card);
            if (selected.length === requestedCount) {
              break;
            }
          } catch (e) {
            console.error('Error fetching card:', e);
          }
          await new Promise(resolve => setTimeout(resolve, 550));
        }

        const shortage = Math.max(0, requestedCount - selected.length);
        return { selected, shortage };
      }

      async function fetchCardsByType(typeQuery, requestedCount) {
        if(requestedCount === 0) {
          return { selected: [], shortage: 0 };
        }
        const query = encodeURIComponent(`type:${typeQuery} legal:edh id<=${commanderColors} -is:commander`);
        const response = await fetch(`https://api.scryfall.com/cards/search?q=${query}`);
        if (!response.ok) {
          throw new Error('Failed to fetch cards from Scryfall.');
        }
        const results = await response.json();
        const firstPageCards = Array.isArray(results.data) ? results.data : [];
        return selectUniqueCards(firstPageCards, requestedCount);
      }

      const creatureSelection = await fetchCardsByType('creature', creatures);
      const artifactSelection = await fetchCardsByType('artifact', artifacts);
      const landSelection = await fetchCardsByType('land -type:basic', lands);
      const instantSelection = await fetchCardsByType('instant', instants);
      const sorcerySelection = await fetchCardsByType('sorcery', sorceries);
      const planeswalkerSelection = await fetchCardsByType('planeswalker', planeswalkers);

      creaturesDeck.push(...creatureSelection.selected);
      artifactsDeck.push(...artifactSelection.selected);
      landsDeck.push(...landSelection.selected);
      instantsDeck.push(...instantSelection.selected);
      sorceriesDeck.push(...sorcerySelection.selected);
      planeswalkersDeck.push(...planeswalkerSelection.selected);

      basicLandCount += creatureSelection.shortage;
      basicLandCount += artifactSelection.shortage;
      basicLandCount += landSelection.shortage;
      basicLandCount += instantSelection.shortage;
      basicLandCount += sorcerySelection.shortage;
      basicLandCount += planeswalkerSelection.shortage;

      const displayGroups = [
        { label: 'Creatures', cards: creaturesDeck },
        { label: 'Artifacts', cards: artifactsDeck },
        { label: 'Instants', cards: instantsDeck },
        { label: 'Sorceries', cards: sorceriesDeck },
        { label: 'Planeswalkers', cards: planeswalkersDeck }
      ];

      [creaturesDeck, artifactsDeck, landsDeck, instantsDeck, sorceriesDeck, planeswalkersDeck].forEach(arr =>
        arr.sort((a, b) => a.name.localeCompare(b.name))
      );

      let html = '';
      displayGroups.forEach(group => {
        if (group.cards.length > 0) {
          html += `<h4>${group.label} (${group.cards.length})</h4><ul>`;
          group.cards.forEach(card => {
            html += `<li class="card-entry"><a href="${card.scryfall_uri}" target="_blank">${card.name}</a><div class="card-tooltip"><img src="${getCardImageUrl(card)}" alt="${card.name}"></div></li>`;
          });
          html += '</ul>';
        }
      });

      const totalLandCount = landsDeck.length + basicLandCount;
      const basicLandEntries = [];

      if (basicLandCount > 0) {
        const displayOrder = ['w', 'u', 'b', 'r', 'g', 'c'];
        const landNameMap = {
          w: 'Plains',
          u: 'Island',
          b: 'Swamp',
          r: 'Mountain',
          g: 'Forest',
          c: 'Wasteland'
        };

        let colorKeys = commanderColors
          .split('')
          .filter(c => displayOrder.includes(c))
          .sort((a, b) => displayOrder.indexOf(a) - displayOrder.indexOf(b));

        if (colorKeys.length === 0) {
          colorKeys = ['c'];
        }

        const perColor = Math.floor(basicLandCount / colorKeys.length);
        let extra = basicLandCount % colorKeys.length;

        colorKeys.forEach(color => {
          let count = perColor;
          if (extra > 0) {
            count += 1;
            extra -= 1;
          }
          if (count > 0) {
            basicLandEntries.push({ name: landNameMap[color], count });
          }
        });
      }

      if (landsDeck.length > 0 || basicLandEntries.length > 0) {
        html += `<h4>Lands (${totalLandCount})</h4>`;

        if (landsDeck.length > 0) {
          landsDeck.forEach(card => {
            html += `<li class="card-entry"><a href="${card.scryfall_uri}" target="_blank">${card.name}</a><div class="card-tooltip"><img src="${getCardImageUrl(card)}" alt="${card.name}"></div></li>`;
          });
          html += '</ul>';
        }

        if (basicLandEntries.length > 0) {
          const basicTotal = basicLandEntries.reduce((sum, entry) => sum + entry.count, 0);
          basicLandEntries.forEach(entry => {
            html += `<li>${entry.name} x ${entry.count}</li>`;
          });
          html += '</ul>';
        }
      }

      deckResultDiv.innerHTML = html;
      const clearDeckWindow = document.querySelector('.clear-deck-row');
      if (clearDeckWindow) {
        clearDeckWindow.classList.remove('hidden');
      }
    }

    function clearDeck() {
      const deckResultDiv = document.getElementById('deckResult');
      deckResultDiv.innerHTML = '';
      const inputs = document.querySelectorAll('.deck-controls input');
      inputs.forEach(input => input.disabled = false);
      const buildBtn = document.getElementById('buildDeckBtn');
      const sum = Array.from(inputs).reduce((acc, input) => acc + parseInt(input.value || 0), 0);
      buildBtn.disabled = sum !== 99;
      const clearDeckRow = document.querySelector('.clear-deck-row');
      if (clearDeckRow) {
        clearDeckRow.classList.add('hidden');
      }
    }

    function clearCommander() {
      resultDiv.innerHTML = '';
      errorDiv.textContent = '';
      loadingDiv.textContent = '';
      selectedColors = [];
      colorButtons.forEach(btn => btn.classList.remove('active'));
      updateButtonState();
      const clearDeckRow = document.querySelector('.clear-deck-row');
      if (clearDeckRow) {
        clearDeckRow.classList.add('hidden');
      }
    }

    function getCardImageUrl(card) {
      return card.image_uris
        ? card.image_uris.normal
        : card.card_faces?.[0]?.image_uris?.normal || '';
    }
