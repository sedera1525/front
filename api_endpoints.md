# Adventure Today - API Endpoints

This document outlines the REST API endpoints required to power the Adventure Today magazine website.

## 1. Slides

### `GET /api/slides`

-   **Description**: Retrieves a list of slides for the main hero section carousel.
-   **Response Body**: `HeroSlide[]`
-   **Example Response**:
    ```json
    [
      {
        "id": 1,
        "bgImage": "https://picsum.photos/1600/900?image=1060",
        "badges": [
          { "text": "Editor Choice", "color": "bg-yellow-400 text-black" },
          { "text": "Adventure Event", "color": "bg-blue-500 text-white" }
        ],
        "title": "Announcing AdventureWeek at Okinawa",
        "excerpt": "Join us for a week of unparalleled adventure, workshops, and exploration in the beautiful islands of Okinawa.",
        "ctaText": "Read Story – 5 min read",
        "pillTitle": "Okinawa Adventure"
      }
    ]
    ```

## 2. Categories

### `GET /api/categories/featured`

-   **Description**: Retrieves a short list of featured categories for the homepage.
-   **Response Body**: `Category[]`
-   **Example Response**:
    ```json
    [
      {
        "name": "Destination",
        "imageUrl": "https://picsum.photos/seed/destination/600/400",
        "description": "Discover breathtaking new places and hidden gems."
      }
    ]
    ```

### `GET /api/categories`

-   **Description**: Retrieves a complete list of all available article categories.
-   **Response Body**: `Category[]`
-   **Example Response**: (Same structure as above, but with all categories)

## 3. Articles & Stories

### `GET /api/stories/latest`

-   **Description**: Retrieves a list of the most recently published articles for the homepage.
-   **Response Body**: `Story[]`
-   **Example Response**:
    ```json
    [
      {
        "id": 5,
        "title": "The Best Lightweight Tents for 2024",
        "imageUrl": "https://picsum.photos/seed/tent/600/400",
        "category": "Equipment",
        "categoryColor": "bg-purple-500",
        "author": { "name": "Mike Chan" },
        "date": "October 21, 2024",
        "readTime": "7 min",
        "excerpt": "We've tested the top lightweight tents on the market to help you find the perfect shelter."
      }
    ]
    ```

### `GET /api/stories/trending`

-   **Description**: Retrieves a list of the most popular or trending articles for the sidebar.
-   **Response Body**: `TrendingStory[]`
-   **Example Response**:
    ```json
    [
      {
        "id": 1,
        "title": "Driverless cars need to make their passengers feel like drivers",
        "imageUrl": "https://picsum.photos/seed/car/100/100",
        "date": "December 13, 2024",
        "comments": 5
      }
    ]
    ```

### `GET /api/articles/:id`

-   **Description**: Retrieves the full content and details for a single article, specified by its ID.
-   **Response Body**: `Article`
-   **Example Response**:
    ```json
    {
      "id": 2,
      "title": "Exploring the Untouched Scottish Highlands",
      "imageUrl": "https://picsum.photos/1200/600?image=1043",
      "category": "Destination",
      "categoryColor": "bg-red-500",
      "author": {
        "name": "Jane Cooper",
        "avatarUrl": "https://picsum.photos/seed/jane/100/100"
      },
      "date": "October 26, 2024",
      "content": "<p>The Scottish Highlands are a rugged, mountainous region of Scotland...</p>"
    }
    ```

### `GET /api/articles`

-   **Description**: Retrieves a list of articles, filtered by category. This endpoint should support pagination for infinite scrolling.
-   **Query Parameters**:
    -   `category` (string, required): The name of the category to filter by (e.g., `Guides`).
    -   `page` (number, optional): The page number for pagination (e.g., `1`).
    -   `limit` (number, optional): The number of articles per page (e.g., `9`).
-   **Response Body**: `Story[]`
-   **Example Request**: `GET /api/articles?category=Guides&page=1&limit=9`

## 4. Gallery

### `GET /api/gallery`

-   **Description**: Retrieves a list of all images for the photo gallery.
-   **Response Body**: `GalleryImage[]`
-   **Example Response**:
    ```json
    [
      {
        "id": 1,
        "imageUrl": "https://picsum.photos/seed/gallery1/800/600",
        "title": "Mountain Vista",
        "category": "Landscapes"
      }
    ]
    ```

## 5. Site Content

### `GET /api/president-message`

-   **Description**: Retrieves the content for the "President's Message" section.
-   **Response Body**: `President`
-   **Example Response**:
    ```json
    {
      "name": "Alexandre Moreau",
      "title": "Président & Fondateur, Adventure Today",
      "quote": "\"L'aventure, ce n'est pas seulement les destinations que nous atteignons...\"",
      "message": "Ici, à Adventure Today, notre mission est de vous inciter à sortir de votre zone de confort...",
      "imageUrl": "https://picsum.photos/seed/president/600/700"
    }
    ```
