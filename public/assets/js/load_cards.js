// Global data arrays
let cards = [];
let filters = [];
let toolsCategories = [];

// Function to show loader
function showLoader() {
    // Add your loader HTML or use a library like spin.js
    // Here, I'm assuming you have a loader with the ID 'loader' in your HTML
    $('#loader').show();
}

// Function to hide loader
function hideLoader() {
    $('#loader').hide();
}


// Fetch data from the server
async function fetchData() {
    try {
        showLoader();

        const categoriesResponse = await fetch('/api/categories');
        const categories = await categoriesResponse.json();
        filters = categories;
        renderFilters([...categories]);

        const toolsResponse = await fetch('/api/tools');
        const data = await toolsResponse.json();
        cards = data.tools;

        const toolsCategoriesResponse = await fetch('/api/tools_categories');
        const toolsCategoriesData = await toolsCategoriesResponse.json();
        toolsCategories = toolsCategoriesData.toolsCategories;

        renderCards(cards);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        hideLoader();
    }
}

// Data fetching
fetchData();

// Render cards
function renderCards(cards) {
    $('#toolsRow').empty();
    const categories = toolsCategories;
    cards.forEach(tool => {
        let tool_categories = [];
        categories.filter(category => {
            if(category.tool_id === tool.id) {

                // Find match by id instead of index
                const match = filters.find(f => f.id === category.category_id);

                if(match) {
                    tool_categories.push(match.id_name);
                }
            }
        })

        const cardHTML = createCardHTML(tool, tool_categories);

        $('#toolsRow').append(cardHTML);
    });

    // Click handler for like button
    $('.like-button').click(function () {
        var card = $(this).closest('.card');
        var cardId = card.attr('id');
        var categories = card.data('categories').split(',');
        var likeIcon = $(this).find('.like');

        // Toggle liked visual state
        if (likeIcon.hasClass('fa-heart-o')) {
            likeIcon.removeClass('fa-heart-o');
            likeIcon.addClass('fa-heart liked');
        } else {
            likeIcon.removeClass('fa-heart liked');
            likeIcon.addClass('fa-heart-o');
        }

        // Get liked cards from storage
        let likedCards = localStorage.getItem('likedCards');
        if(likedCards) {
            likedCards = JSON.parse(likedCards);
        } else {
            likedCards = {};
        }

        // Check if data is string
        if (typeof likedCards != "string") {
            likedCards = {};
        } else {
            likedCards = JSON.parse(likedCards);
        }

        // Update like value
        if(likeIcon.hasClass('fa-heart')) {
            likedCards[cardId] = {
                id: cardId,
                categories: categories
            };
        } else {
            delete likedCards[cardId];
        }

        // Save likes
        localStorage.setItem('likedCards', JSON.stringify(likedCards));
    });


    putLikes();
}

// On load, set saved like states
function putLikes() {
    $(document).ready(function () {

        // Get liked cards
        const likedCards = JSON.parse(localStorage.getItem('likedCards'));

        // Set like states
        if (likedCards) {
            Object.keys(likedCards).forEach(function (cardId) {

                var card = $('#' + cardId);
                var icon = card.find('.like');

                if (likedCards[cardId]) {
                    icon.removeClass('fa-heart-o').addClass('fa-heart liked');
                } else {
                    icon.removeClass('fa-heart liked').addClass('fa-heart-o');
                }

            });
        }

    });
}

// Render filters
function renderFilters(filters) {
    filters.sort((a, b) => a.name.localeCompare(b.name));
    filters.forEach(f => {
        const filterHTML = createFilterHTML(f);
        $('#filters').append(filterHTML);
    });
}

// Sort buttons
const $sortLinks = $('.dropdown-item');

// Initially set first link active
$sortLinks.eq(0).addClass('active');

// Sorting click handler
$sortLinks.click(function () {

    // Remove active from all
    $sortLinks.removeClass('active');
    let sortedCards = [...cards]

    // Add active to clicked
    $(this).addClass('active');
    if ($(this).is('#sort-popularity')) {
        sortedCards = sortByPopularity([...cards]); // Create a copy to avoid mutating the original array
    } else if ($(this).is('#sort-date')) {
        sortedCards = sortByDate([...cards]); // Create a copy to avoid mutating the original array
    } else if ($(this).is('#sort-name')) {
        sortedCards = sortByName([...cards]); // Create a copy to avoid mutating the original array
    }
    renderCards(sortedCards);

});

// Filter handlers
$('#filters').on('change', 'input', function () {
    let checkedFilters = getCheckedFilters();
    console.log("filters changed to", checkedFilters);
    let filteredCards = filterCards([...cards], checkedFilters, toolsCategories); // Create a copy to avoid mutating the original array
    console.log("filtered cards", filteredCards);
    if (checkedFilters.length === 0) {
        renderCards(cards);
    } else {
        renderCards(filteredCards);
    }
});

// Search handler
$('#searchBar').off('keyup').on('keyup', function (e) {
    if (e.keyCode === 13) {
        const searchTerm = $(this).val().toLowerCase();
        console.log(searchTerm);
        if (searchTerm) {

            showLoader();

            fetch(`/api/tools?search=${searchTerm}`)
                .then(res => res.json())
                .then(data => {
                    searchCards = data.tools;
                    renderCards(searchCards);
                })
                .catch(err => {
                    console.log(err);
                })
                .finally(() => {
                    hideLoader();
                });

        } else {
            // Empty search, show all
            renderCards(cards);
        }
    }
});

/**
 * Creates the HTML for a card displaying tool information.
 *
 * @param {Object} tool - The tool object containing information about the tool.
 * @param categories - The categories of the tool.
 * @return {string} The HTML code for the tool card.
 */
function createCardHTML(tool, categories) {
    let img_src = tool.name.replace(/ /g, '_').replace(/\(/g, '').replace(/\)/g, '').replace(/!/g, '')
        .replace(/\?/g, '').replace(/\./g, '_').toLowerCase();
    img_src += ".png";
    img_src = `assets/img/tools_preview/${img_src}`

    let icon = "";
    if (tool.pricing === "Бесплатный" || tool.pricing === "Бесплатный триал") {
        icon = "fa fa-check";
    } else if (tool.pricing === "Платный" || tool.pricing === "Условно бесплатно") {
        icon = "fa fa-dollar";
    } else icon = "fa fa-dollar";

    return `
<div class="col">
   <div class="card catalog-card" id="${tool.id}" data-categories="${categories.join(',')}">
      <img class="card-img-top w-100 d-block" src="${img_src}" alt="${tool.name}"/>
      <div class="card-body" style="border-radius: 16px;">
         <h4 class="card-title">${tool.name}</h4>
         <h6 class="text-muted card-subtitle mb-2">Лайков: ${tool.likes}</h6>
         <p class="card-text">${tool.description}</p>
         <div class="d-flex justify-content-start align-items-center" style="width: auto;">
            <div class="d-flex align-items-center price-tag"><i class="${icon} text-primary" style="font-size: 14px;"></i><span>${tool.pricing}</span>
            </div>
         </div>
         <div class="row gx-2">
            <div class="col-auto"><a class="btn btn-primary" role="button" style="margin-top: 16px;" href="${tool.website_url}" target="_blank">Сайт</a></div>
            <div class="col-auto"><button class="btn like-button" type="button" style="margin-top: 16px;"><i class="fa fa-heart-o like"></i></button></div>
         </div>
      </div>
   </div>
</div>
`;
}

// Helper functions

function createFilterHTML(f) {
    return `
        <div class="cat">
            <label class="form-label">
                <input type="checkbox" value=${f.id} />
                <span class="d-flex align-items-center">${f.name}</span>
            </label>
        </div>
    `;
}

function sortByPopularity(cards) {
    return cards.sort((a, b) => b.likes - a.likes);
}

function sortByDate(cards) {
    return cards.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
}

function sortByName(cards) {
    return cards.sort((a, b) => a.name.localeCompare(b.name));
}

function getCheckedFilters() {
    $('.cat').css('opacity', 0.5);

    let filters = [];

    $('.cat input:checked').each(function () {
        filters.push(parseInt($(this).val()));

        // Update opacity
        $(this).closest('.cat').css('opacity', 1);
    });

    return filters;
}

// Function to filter cards based on selected filters
function filterCards(cards, selectedFilters) {
    if (selectedFilters.length === 0) {
        return cards; // No filters selected, return all cards
    }

    return cards.filter(card => {
        // Assuming each card has a 'categories' property in the new structure
        const cardCategories = toolsCategories.filter(tc => tc.tool_id === card.id).map(tc => tc.category_id);
        console.log("selectedFilters: ", selectedFilters, "card id: ", card.id, "card categories: ", cardCategories)
        return selectedFilters.every(filter => cardCategories.includes(filter));
    });
}
