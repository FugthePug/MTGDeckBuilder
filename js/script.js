    const generateBtn = document.getElementById('generateBtn');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const loadingDiv = document.getElementById('loading');
    const colorButtons = document.querySelectorAll('.color-btn');

    let selectedColors = [];

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
      });
    });

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
          <h2>${commander.name}</h2>
          <p><strong>Mana Cost:</strong> ${commander.mana_cost || 'N/A'}</p>
          <p><strong>Type:</strong> ${commander.type_line}</p>
          <p><strong>Oracle Text:</strong></p>
          <p>${commander.oracle_text || 'No text available.'}</p>
          ${imageUrl ? `<img src="${imageUrl}" alt="${commander.name}">` : ''}
        `;
      } catch (error) {
        loadingDiv.textContent = '';
        errorDiv.textContent = `Error: ${error.message}`;
      }
    });