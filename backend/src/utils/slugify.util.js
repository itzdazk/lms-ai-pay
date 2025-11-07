// src/utils/slugify.util.js

/**
 * Convert string to URL-friendly slug
 * @param {string} text - Text to slugify
 * @returns {string} Slugified text
 */
const slugify = (text) => {
    if (!text) return ''

    // Vietnamese character map
    const vietnameseMap = {
        à: 'a',
        á: 'a',
        ả: 'a',
        ã: 'a',
        ạ: 'a',
        ă: 'a',
        ằ: 'a',
        ắ: 'a',
        ẳ: 'a',
        ẵ: 'a',
        ặ: 'a',
        â: 'a',
        ầ: 'a',
        ấ: 'a',
        ẩ: 'a',
        ẫ: 'a',
        ậ: 'a',
        è: 'e',
        é: 'e',
        ẻ: 'e',
        ẽ: 'e',
        ẹ: 'e',
        ê: 'e',
        ề: 'e',
        ế: 'e',
        ể: 'e',
        ễ: 'e',
        ệ: 'e',
        ì: 'i',
        í: 'i',
        ỉ: 'i',
        ĩ: 'i',
        ị: 'i',
        ò: 'o',
        ó: 'o',
        ỏ: 'o',
        õ: 'o',
        ọ: 'o',
        ô: 'o',
        ồ: 'o',
        ố: 'o',
        ổ: 'o',
        ỗ: 'o',
        ộ: 'o',
        ơ: 'o',
        ờ: 'o',
        ớ: 'o',
        ở: 'o',
        ỡ: 'o',
        ợ: 'o',
        ù: 'u',
        ú: 'u',
        ủ: 'u',
        ũ: 'u',
        ụ: 'u',
        ư: 'u',
        ừ: 'u',
        ứ: 'u',
        ử: 'u',
        ữ: 'u',
        ự: 'u',
        ỳ: 'y',
        ý: 'y',
        ỷ: 'y',
        ỹ: 'y',
        ỵ: 'y',
        đ: 'd',
        À: 'A',
        Á: 'A',
        Ả: 'A',
        Ã: 'A',
        Ạ: 'A',
        Ă: 'A',
        Ằ: 'A',
        Ắ: 'A',
        Ẳ: 'A',
        Ẵ: 'A',
        Ặ: 'A',
        Â: 'A',
        Ầ: 'A',
        Ấ: 'A',
        Ẩ: 'A',
        Ẫ: 'A',
        Ậ: 'A',
        È: 'E',
        É: 'E',
        Ẻ: 'E',
        Ẽ: 'E',
        Ẹ: 'E',
        Ê: 'E',
        Ề: 'E',
        Ế: 'E',
        Ể: 'E',
        Ễ: 'E',
        Ệ: 'E',
        Ì: 'I',
        Í: 'I',
        Ỉ: 'I',
        Ĩ: 'I',
        Ị: 'I',
        Ò: 'O',
        Ó: 'O',
        Ỏ: 'O',
        Õ: 'O',
        Ọ: 'O',
        Ô: 'O',
        Ồ: 'O',
        Ố: 'O',
        Ổ: 'O',
        Ỗ: 'O',
        Ộ: 'O',
        Ơ: 'O',
        Ờ: 'O',
        Ớ: 'O',
        Ở: 'O',
        Ỡ: 'O',
        Ợ: 'O',
        Ù: 'U',
        Ú: 'U',
        Ủ: 'U',
        Ũ: 'U',
        Ụ: 'U',
        Ư: 'U',
        Ừ: 'U',
        Ứ: 'U',
        Ử: 'U',
        Ữ: 'U',
        Ự: 'U',
        Ỳ: 'Y',
        Ý: 'Y',
        Ỷ: 'Y',
        Ỹ: 'Y',
        Ỵ: 'Y',
        Đ: 'D',
    }

    return (
        text
            .toString()
            .toLowerCase()
            .trim()
            // Replace Vietnamese characters
            .replace(/[àáảãạăằắẳẵặâầấẩẫậ]/g, 'a')
            .replace(/[èéẻẽẹêềếểễệ]/g, 'e')
            .replace(/[ìíỉĩị]/g, 'i')
            .replace(/[òóỏõọôồốổỗộơờớởỡợ]/g, 'o')
            .replace(/[ùúủũụưừứửữự]/g, 'u')
            .replace(/[ỳýỷỹỵ]/g, 'y')
            .replace(/đ/g, 'd')
            .replace(/[ÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]/g, 'a')
            .replace(/[ÈÉẺẼẸÊỀẾỂỄỆ]/g, 'e')
            .replace(/[ÌÍỈĨỊ]/g, 'i')
            .replace(/[ÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]/g, 'o')
            .replace(/[ÙÚỦŨỤƯỪỨỬỮỰ]/g, 'u')
            .replace(/[ỲÝỶỸỴ]/g, 'y')
            .replace(/Đ/g, 'd')
            // Replace spaces with hyphens
            .replace(/\s+/g, '-')
            // Remove all non-word chars except hyphens
            .replace(/[^\w\-]+/g, '')
            // Replace multiple hyphens with single hyphen
            .replace(/\-\-+/g, '-')
            // Remove leading/trailing hyphens
            .replace(/^-+/, '')
            .replace(/-+$/, '')
    )
}

export default slugify
