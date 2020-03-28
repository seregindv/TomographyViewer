class App {
    constructor() {
    }

    run() {
        $.get("configuration.json").done(data => {
            this._data = data;
            const index = $("#index");
            index.empty();
            for (let page of data.pages)
                index.append($("<div class='page-link'></div>").text(page.title).data("page", page).click(e => {
                    this._navigate(e.target);
                }));
        });
    }

    _navigate(div) {
        const element = $("#page");
        element.empty();
        const page = $(div).data("page");

        element.css("visibility", "visible");
        new ImageViewer(element, page, this._data);
    }
}

class ImageViewer {
    constructor(element, page, data) {
        this._currentImageIndex = 0;
        this._images = [];
        this._page = page;
        this._data = data;
        this._html = `<div>
    <div class="load-indicator"></div>
    <div class="image-div">
        <img class="ximg" />
    </div>
    <div class="scroller">
        <div class="panel button">&lt;</div>
        <div class="panel">&nbsp</div>
        <div class="panel button">&gt;</div>
    </div>
</div>`;

        document.title = page.title;
        this._loadImages();
        const content = $(this._html).appendTo(element);
        this._img = content.find(".ximg");
        this._loadIndicator = content.find(".load-indicator");
        const panels = content.find(".panel");
        $(panels[0]).click(e => this._moveLeft(e));
        $(panels[1]).on("touchstart", e => this._onTouch(e))
            .on("touchmove", e => this._onTouch(e))
            .on("mousemove", e => this._onTouch(e));
        $(panels[2]).click(e => this._moveRight(e));
        this._updateImageSource();
    }

    _updateImageSource() {
        this._img.attr("src", this._images[this._currentImageIndex].src);
    }

    _loadImages() {
        const imageName = this._data.imageFormat.split("|");
        const numberLength = imageName[1].length;
        this._imagesLoaded = 0;
        const addImage = i => {
            const image = new Image();
            const name = imageName[0] + (imageName[1] + i).substr(i.toString().length, numberLength) + imageName[2];
            const folderNumber = Math.floor((i - 1) / 200);
            let folder = "images";
            if (folderNumber > 0)
                folder += folderNumber + 1;
            image.src = folder + "/" + name;
            image.onload = () => {
                ++this._imagesLoaded;
                let text = this._imagesLoaded === this._imageCount ? "" : `Loading ${this._imagesLoaded} / ${this._imageCount}`;
                this._loadIndicator.text(text);
            };
            this._images.push(image);
        };
        if (this._page.images.ids) {
            this._imageCount = this._page.images.ids.length;
            for (let i of this._page.images.ids)
                addImage(i);
        }
        else {
            this._imageCount = this._page.images.to - this._page.images.from + 1;
            for (let i = this._page.images.from; i <= this._page.images.to; i++)
                addImage(i);
        }

    }

    _moveLeft(e) {
        if (this._currentImageIndex > 0) {
            --this._currentImageIndex;
            this._updateImageSource();
        }
        e.preventDefault();
        e.stopPropagation();
    }

    _moveRight(e) {
        if (this._currentImageIndex < this._images.length - 1) {
            ++this._currentImageIndex;
            this._updateImageSource();
        }
        e.preventDefault();
        e.stopPropagation();
    }

    _onTouch(e) {
        let touchobj;
        if (e.changedTouches)
            touchobj = e.changedTouches[0];
        else
            touchobj = e;
        const x = parseInt(touchobj.clientX);
        this._currentImageIndex = Math.round(this._images.length * (x - 60 - e.target.offsetLeft) / (e.target.offsetWidth - 120));
        if (this._currentImageIndex < 0)
            this._currentImageIndex = 0;
        else if (this._currentImageIndex >= this._images.length)
            this._currentImageIndex = this._images.length - 1;
        this._updateImageSource();
        e.preventDefault();
    }
}

$(document).ready(() => {
    new App().run();
});