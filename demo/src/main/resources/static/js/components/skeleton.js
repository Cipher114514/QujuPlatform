var Skeleton = {
    renderActivityCard: function(count) {
        var html = '';
        for (var i = 0; i < count; i++) {
            html += '<div class="skeleton-card">' +
                '<div class="skeleton-line skeleton-line-lg"></div>' +
                '<div class="skeleton-line skeleton-line-md"></div>' +
                '<div class="skeleton-line skeleton-line-sm"></div>' +
                '<div class="skeleton-tags">' +
                    '<div class="skeleton-tag"></div>' +
                    '<div class="skeleton-tag"></div>' +
                '</div>' +
            '</div>';
        }
        return html;
    },

    renderUserCard: function(count) {
        var html = '';
        for (var i = 0; i < count; i++) {
            html += '<div class="skeleton-user-card">' +
                '<div class="skeleton-avatar"></div>' +
                '<div class="skeleton-user-content">' +
                    '<div class="skeleton-line skeleton-line-md"></div>' +
                    '<div class="skeleton-line skeleton-line-sm"></div>' +
                    '<div class="skeleton-line skeleton-line-xs"></div>' +
                '</div>' +
            '</div>';
        }
        return html;
    },

    renderList: function(type, count) {
        if (type === 'activity') {
            return this.renderActivityCard(count);
        } else if (type === 'user') {
            return this.renderUserCard(count);
        }
        return '';
    },

    renderLoading: function() {
        return '<div class="skeleton-loading"><span class="skeleton-spinner"></span><span class="skeleton-text">加载中...</span></div>';
    }
};