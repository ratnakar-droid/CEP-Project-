/* =========================================
   NUTRI PRO - FOOD SCANNER
   Barcode + Open Food Facts + Health Score
========================================= */

let scanner = null;
let scannerRunning = false;


/* =========================================
   START BARCODE SCANNER
========================================= */

function startScanner() {

    document.getElementById("cameraSection").style.display = "block";
    document.getElementById("errorSection").style.display = "none";

    loadScannerLibrary();
}


/* =========================================
   LOAD HTML5 QR CODE LIBRARY
========================================= */

function loadScannerLibrary() {

    if (window.Html5Qrcode) {
        createScanner();
        return;
    }

    const script = document.createElement("script");

    script.src =
        "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";

    script.onload = function () {
        createScanner();
    };

    script.onerror = function () {
        showError("Scanner library load nahi ho payi. Internet connection check karo.");
    };

    document.head.appendChild(script);
}


/* =========================================
   CREATE SCANNER
========================================= */

function createScanner() {

    if (scannerRunning) {
        return;
    }

    scanner = new Html5Qrcode("reader");

    const config = {
        fps: 10,
        qrbox: {
            width: 280,
            height: 150
        },
        aspectRatio: 1.777778
    };

    scanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
    )
    .then(function () {

        scannerRunning = true;

        console.log("Barcode scanner started");

    })
    .catch(function (error) {

        console.error(error);

        showError(
            "Camera start nahi ho pa raha. Browser ko camera permission do aur HTTPS page use karo."
        );

    });
}


/* =========================================
   SUCCESSFUL BARCODE SCAN
========================================= */

function onScanSuccess(decodedText) {

    if (!decodedText) {
        return;
    }

    console.log("Barcode:", decodedText);

    stopScanner();

    searchBarcode(decodedText);
}


/* =========================================
   SCANNER FAILURE
========================================= */

function onScanFailure(error) {
    // Continuous scanning mein errors normal hain.
}


/* =========================================
   STOP SCANNER
========================================= */

function stopScanner() {

    if (scanner && scannerRunning) {

        scanner.stop()
            .then(function () {

                scanner.clear();
                scannerRunning = false;

            })
            .catch(function (error) {

                console.log("Scanner stop error:", error);

                scannerRunning = false;

            });

    }

    document.getElementById("cameraSection").style.display = "none";
}


/* =========================================
   MANUAL BARCODE SEARCH
========================================= */

function searchBarcode(barcodeFromScanner = null) {

    let barcode = barcodeFromScanner;

    if (!barcode) {

        barcode =
            document.getElementById("barcodeInput").value.trim();

    }

    barcode = barcode.replace(/\D/g, "");

    if (!barcode) {

        showError("Please barcode number enter karo.");

        return;
    }

    if (barcode.length < 7) {

        showError("Barcode number valid nahi lag raha.");

        return;
    }

    showLoading();

    getProductFromAPI(barcode);
}


/* =========================================
   GET PRODUCT FROM OPEN FOOD FACTS
========================================= */

async function getProductFromAPI(barcode) {

    try {

        const fields = [
            "code",
            "product_name",
            "product_name_en",
            "brands",
            "image_front_url",
            "image_url",
            "nutriments",
            "categories",
            "ingredients_text",
            "nutrition_grades",
            "nutriscore_grade"
        ].join(",");

        const apiURL =
            "https://world.openfoodfacts.org/api/v3.6/product/" +
            encodeURIComponent(barcode) +
            ".json?fields=" +
            encodeURIComponent(fields);

        const response = await fetch(apiURL);

        if (!response.ok) {
            throw new Error("API request failed");
        }

        const data = await response.json();

        console.log("Open Food Facts:", data);

        if (
            data.status !== 1 ||
            !data.product
        ) {

            showError(
                "Ye product Open Food Facts database mein nahi mila."
            );

            return;
        }

        displayProduct(data.product);

    }
    catch (error) {

        console.error(error);

        showError(
            "Product information load nahi ho paayi. Internet connection check karo."
        );

    }
}


/* =========================================
   DISPLAY PRODUCT
========================================= */

function displayProduct(product) {

    hideAllSections();

    document.getElementById("resultSection").style.display = "block";

    const productName =
        product.product_name_en ||
        product.product_name ||
        "Unknown Product";

    const brand =
        product.brands ||
        "Brand not available";

    document.getElementById("productName").textContent =
        productName;

    document.getElementById("brandName").textContent =
        brand;


    /* Product Image */

    const image =
        product.image_front_url ||
        product.image_url;

    const imageElement =
        document.getElementById("productImage");

    if (image) {

        imageElement.src = image;
        imageElement.style.display = "block";

    }
    else {

        imageElement.style.display = "none";

    }


    /* Nutrition */

    const nutrition =
        product.nutriments || {};

    const calories =
        getNutritionValue(
            nutrition,
            [
                "energy-kcal_100g",
                "energy-kcal"
            ]
        );

    const protein =
        getNutritionValue(
            nutrition,
            [
                "proteins_100g",
                "proteins"
            ]
        );

    const carbs =
        getNutritionValue(
            nutrition,
            [
                "carbohydrates_100g",
                "carbohydrates"
            ]
        );

    const sugar =
        getNutritionValue(
            nutrition,
            [
                "sugars_100g",
                "sugars"
            ]
        );

    const fat =
        getNutritionValue(
            nutrition,
            [
                "fat_100g",
                "fat"
            ]
        );

    const fiber =
        getNutritionValue(
            nutrition,
            [
                "fiber_100g",
                "fiber"
            ]
        );

    const sodium =
        getNutritionValue(
            nutrition,
            [
                "sodium_100g",
                "sodium"
            ]
        );


    document.getElementById("calories").textContent =
        formatNumber(calories) + " kcal";

    document.getElementById("protein").textContent =
        formatNumber(protein) + " g";

    document.getElementById("carbs").textContent =
        formatNumber(carbs) + " g";

    document.getElementById("sugar").textContent =
        formatNumber(sugar) + " g";

    document.getElementById("fat").textContent =
        formatNumber(fat) + " g";

    document.getElementById("fiber").textContent =
        formatNumber(fiber) + " g";

    document.getElementById("sodium").textContent =
        formatSodium(sodium);


    /* Health Score */

    const result =
        calculateHealthScore({
            calories,
            protein,
            carbs,
            sugar,
            fat,
            fiber,
            sodium
        });

    showHealthScore(result);

}


/* =========================================
   GET NUTRITION VALUE
========================================= */

function getNutritionValue(nutrition, keys) {

    for (const key of keys) {

        const value = Number(nutrition[key]);

        if (
            Number.isFinite(value) &&
            value >= 0
        ) {
            return value;
        }

    }

    return null;
}


/* =========================================
   FORMAT NUMBER
========================================= */

function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {

        return "--";

    }

    return Number(value).toFixed(1);

}


/* =========================================
   FORMAT SODIUM
========================================= */

function formatSodium(value) {

    if (value === null) {
        return "--";
    }

    /*
       Open Food Facts commonly gives sodium
       in grams per 100g.
    */

    const mg = value * 1000;

    return Math.round(mg) + " mg";

}


/* =========================================
   NUTRI PRO HEALTH SCORE
   Score: 0 - 100
========================================= */

function calculateHealthScore(data) {

    let score = 70;

    const reasons = [];


    /* Sugar */

    if (data.sugar !== null) {

        if (data.sugar <= 5) {

            score += 10;

            reasons.push(
                "✅ Sugar is relatively low."
            );

        }
        else if (data.sugar <= 12) {

            score += 2;

            reasons.push(
                "⚠️ Sugar is moderate."
            );

        }
        else if (data.sugar <= 25) {

            score -= 10;

            reasons.push(
                "⚠️ Sugar is high."
            );

        }
        else {

            score -= 20;

            reasons.push(
                "❌ Sugar is very high."
            );

        }

    }


    /* Protein */

    if (data.protein !== null) {

        if (data.protein >= 15) {

            score += 10;

            reasons.push(
                "💪 Good protein content."
            );

        }
        else if (data.protein >= 7) {

            score += 5;

            reasons.push(
                "👍 Provides some protein."
            );

        }
        else {

            reasons.push(
                "ℹ️ Protein content is relatively low."
            );

        }

    }


    /* Fiber */

    if (data.fiber !== null) {

        if (data.fiber >= 6) {

            score += 8;

            reasons.push(
                "🌾 Good fiber content."
            );

        }
        else if (data.fiber >= 3) {

            score += 4;

            reasons.push(
                "👍 Contains some fiber."
            );

        }
        else {

            score -= 2;

            reasons.push(
                "ℹ️ Fiber content is low."
            );

        }

    }


    /* Fat */

    if (data.fat !== null) {

        if (data.fat > 30) {

            score -= 8;

            reasons.push(
                "⚠️ Total fat is high."
            );

        }
        else if (data.fat > 20) {

            score -= 4;

            reasons.push(
                "⚠️ Fat content is moderate-high."
            );

        }

    }


    /* Calories */

    if (data.calories !== null) {

        if (data.calories > 500) {

            score -= 7;

            reasons.push(
                "⚠️ Energy density is high."
            );

        }
        else if (data.calories <= 250) {

            score += 3;

            reasons.push(
                "👍 Moderate calorie density."
            );

        }

    }


    /* Sodium */

    if (data.sodium !== null) {

        const sodiumMG =
            data.sodium * 1000;

        if (sodiumMG > 600) {

            score -= 10;

            reasons.push(
                "❌ Sodium is high."
            );

        }
        else if (sodiumMG > 300) {

            score -= 5;

            reasons.push(
                "⚠️ Sodium is moderate-high."
            );

        }
        else {

            score += 3;

            reasons.push(
                "✅ Sodium is relatively low."
            );

        }

    }


    /* Keep score between 0 and 100 */

    score =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(score)
            )
        );


    let rating = "";

    if (score >= 90) {

        rating = "🟢 Excellent";

    }
    else if (score >= 75) {

        rating = "🟢 Good";

    }
    else if (score >= 60) {

        rating = "🟡 Moderate";

    }
    else if (score >= 40) {

        rating = "🟠 Poor";

    }
    else {

        rating = "🔴 Very Poor";

    }


    return {
        score,
        rating,
        reasons
    };

}


/* =========================================
   SHOW HEALTH SCORE
========================================= */

function showHealthScore(result) {

    document.getElementById("scoreNumber").textContent =
        result.score + " / 100";

    document.getElementById("scoreRating").textContent =
        result.rating;


    const scoreReasons =
        document.getElementById("scoreReasons");

    scoreReasons.innerHTML = "";


    result.reasons.forEach(function (reason) {

        const li =
            document.createElement("li");

        li.textContent = reason;

        scoreReasons.appendChild(li);

    });


    if (result.reasons.length === 0) {

        const li =
            document.createElement("li");

        li.textContent =
            "Not enough nutrition information available.";

        scoreReasons.appendChild(li);

    }

}


/* =========================================
   LOADING
========================================= */

function showLoading() {

    hideAllSections();

    document.getElementById("loadingSection").style.display =
        "block";

}


/* =========================================
   ERROR
========================================= */

function showError(message) {

    hideAllSections();

    document.getElementById("errorSection").style.display =
        "block";

    document.getElementById("errorMessage").textContent =
        message;

}


/* =========================================
   HIDE SECTIONS
========================================= */

function hideAllSections() {

    document.getElementById("cameraSection").style.display =
        "none";

    document.getElementById("loadingSection").style.display =
        "none";

    document.getElementById("resultSection").style.display =
        "none";

    document.getElementById("errorSection").style.display =
        "none";

}


/* =========================================
   NEW SCAN
========================================= */

function newScan() {

    stopScanner();

    hideAllSections();

    document.getElementById("barcodeInput").value = "";

}


/* =========================================
   ADD TO TODAY'S DIET
========================================= */

function addToDiet() {

    alert(
        "Product scan ho gaya! Diet tracking feature next step mein connect karenge."
    );

}


/* =========================================
   DARK MODE
========================================= */

function toggleDark() {

    document.body.classList.toggle("dark");

}