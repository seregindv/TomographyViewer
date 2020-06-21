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
        const $div = $(div);
        if ($div.hasClass("current"))
            return;
        const element = $("#page");
        element.empty();
        $div.siblings().removeClass("current");
        const page = $div.addClass("current").data("page");

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
    <div class="load-indicator" style="margin: 2px 0">
        <div class="progress"></div>
    </div>
    <div class="image-div">
        <img class="ximg" />
    </div>
    <div class="scroller">
        <div class="panel button">&lt;</div>
        <div class="panel">
            <div class="thumb"></div>
        </div>
        <div class="panel button">&gt;</div>
    </div>
</div>`;

        document.title = page.title;
        const content = $(this._html).appendTo(element);
        this._img = content.find(".ximg");
        this._loadIndicator = content.find(".load-indicator");
        const panels = content.find(".panel");
        this._loadImages();
        $(panels[0]).click(e => this._moveLeft(e));
        this._thumbPanel = $(panels[1]);
        this._thumbPanel.on("touchstart", e => this._onTouch(e))
            .on("touchmove", e => this._onTouch(e))
            .on("mousemove", e => this._onTouch(e));
        $(panels[2]).click(e => this._moveRight(e));
        this._thumb = $(".scroller .thumb");
        this._updateImageSource();
        this._updateThumbPosition();
        $(window).resize(() => this._updateThumbPosition());
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
            image.onload = e => {
                if (!this._imageSizeSet){
                    this._img.css({ width: e.target.width + "px", height: e.target.height + "px" });
                    this._imageSizeSet = true;
                }
                ++this._imagesLoaded;
                this._showProgress();
            };
            image.onerror = () => this._showProgress(true);
            this._images.push(image);
        };
        if (this._page.images.ids) {
            this._imageCount = this._page.images.ids.length;
            this._showProgress();
            for (let i of this._page.images.ids)
                addImage(i);
        }
        else {
            this._imageCount = this._page.images.to - this._page.images.from + 1;
            this._showProgress();
            for (let i = this._page.images.from; i <= this._page.images.to; i++)
                addImage(i);
        }

    }

    _moveLeft(e) {
        if (this._currentImageIndex > 0) {
            --this._currentImageIndex;
            this._updateImageSource();
            this._updateThumbPosition();
        }
        e.preventDefault();
        e.stopPropagation();
    }

    _moveRight(e) {
        if (this._currentImageIndex < this._images.length - 1) {
            ++this._currentImageIndex;
            this._updateImageSource();
            this._updateThumbPosition();
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
        const offset = this._thumbPanel.offset();
        this._currentImageIndex = Math.round(this._images.length * (e.pageX - offset.left - 25) / (this._thumbPanel.width() - 50));
        if (this._currentImageIndex < 0)
            this._currentImageIndex = 0;
        else if (this._currentImageIndex >= this._images.length)
            this._currentImageIndex = this._images.length - 1;
        this._updateImageSource();
        this._updateThumbPosition();

        return this._preventDefault(e);
    }

    _preventDefault(e) {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
        e.cancelBubble = true;
        e.returnValue = false;
        return false;
    }

    _updateThumbPosition() {
        if (this._previousImageIndex !== undefined && this._previousImageIndex === this._currentImageIndex)
            return;
        const thumbPanelWidth = this._thumbPanel.width() - 50;
        const x = thumbPanelWidth / (this._images.length - 1) * this._currentImageIndex;
        this._previousImageIndex = this._currentImageIndex;
        this._thumb.css("left", x + "px");
    }

    _showProgress(error) {
        if (error) {
            this._loadIndicator.addClass("error");
            return;
        }
        if (!this._loadIndicatorProgress)
            this._loadIndicatorProgress = $(".load-indicator .progress");
        this._loadIndicatorProgress.width((this._loadIndicator.width() * this._imagesLoaded / this._imageCount) + "px");
        if (this._imagesLoaded === this._imageCount)
            this._loadIndicator.css("visibility", "hidden");
    }
}

$(document).ready(() => {
    new App().run();
});