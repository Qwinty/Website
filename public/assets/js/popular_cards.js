async function fetchData() {
    try {
        const toolsResponse = await fetch('/api/tools?sortBy=likes&limit=6');
        const data = await toolsResponse.json();
        cards = data.tools;
        renderCards(cards);
    } catch (error) {
        console.error('Error:', error);
    }

    console.log('Data fetched successfully');
}

fetchData()

async function getRecommendedCards() {
    try {
        const likedCards = localStorage.getItem('likedCards') || [];
        if (!likedCards || likedCards.length === 0) {
            $("#recommendations_header").hide()
            $("#recommendations").hide()
            return;
        }

        // Get all categories
        let categories = [];

        Object.values(JSON.parse(likedCards)).forEach(card => {
            categories.push(...card.categories);
        });

        // Get unique categories
        let uniqueCategories = [...new Set(categories)];

        const toolsResponse = await fetch('/api/tools?sortBy=likes&limit=6&category=' + uniqueCategories.join(','));
        const data = await toolsResponse.json();
        cards = data.tools;
        toolsCategories = data.toolsCategories;
        renderCards(cards, "recommendations");
    } catch (error) {
        console.error('Error:', error);
    }
    console.log('Recommended cards fetched successfully');
}

getRecommendedCards()

// Render cards
function renderCards(cards, containerId = 'toolsRow') {
    $('#' + containerId).empty();

    cards.forEach(tool => {
        const cardHTML = createCardHTML(tool);
        $('#' + containerId).append(cardHTML);
    });

    // Click handler for like button
    $('.like-button').click(function () {

        // Get card element
        var card = $(this).closest('.card');

        // Get ID
        var cardId = card.attr('id');

        // Get like element
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
        var likedCards = localStorage.getItem('likedCards');

        // Check if data is stringified
        if (typeof likedCards != "string") {
            likedCards = {};
        } else {
            likedCards = JSON.parse(likedCards);
        }

        // Update like value
        likedCards[cardId] = likeIcon.hasClass('fa-heart');

        // Save updated likes
        localStorage.setItem('likedCards', JSON.stringify(likedCards));

    });


    putLikes();
}

function putLikes() {
    $(document).ready(function () {

        // Get liked cards
        var likedCards = JSON.parse(localStorage.getItem('likedCards'));

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


function createCardHTML(tool) {
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
   <div class="card catalog-card" id="${tool.id}">
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

