var cheerio = require('cheerio');
var { getId, getElement, getDate, sanatizer } = require('../helpers');

module.exports = {
  effectParse: (body) => {
    var item = [];
    var $ = cheerio.load(body);
    $('div.ak-list-element').each(function (i, element) {
      var stat = $(this).find("div.ak-title").text().trim();
      var statToTest = stat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      if (statToTest.includes('title') || statToTest.includes('titre') || statToTest.includes('attitude') || statToTest.includes('emote') ||
        statToTest.includes('echangeable') || statToTest.includes('exchangeable') || statToTest.includes('lie au') || statToTest.includes('linked to')) {
        if (statToTest.includes('title') || statToTest.includes('titre')) item.push({ 'title': stat.split(':')[1].trim() });
        else if (statToTest.includes('attitude') || statToTest.includes('emote')) item.push({ 'emote': stat });
        else if (statToTest.includes('echangeable') || statToTest.includes('exchangeable')) item.push({ 'exchangeable': getDate(stat) });
        else if (statToTest.includes('lie au') || statToTest.includes('linked to')) item.push({ 'linked': true });
      } else {
        var stat = $(this).find("div.ak-title").text().trim();
        var element = getElement(stat);
        element = element.charAt(0).toUpperCase() + element.slice(1);
        var numbers = [];
        stat.replace(/(-?\d[\d\.]*)/g, function (x) {
          var n = Number(x); if (x == n) { numbers.push(x); }
        });
        if (typeof numbers[1] == 'undefined') var groupeElement = { [element]: { 'from': numbers[0] } };
        else var groupeElement = { [element]: { 'from': numbers[0], 'to': numbers[1] } };
        item.push(groupeElement);
      }
    });
    return item;
  },

  recipeParse: (body) => {
    var item = [];
    var $ = cheerio.load(body);
    $('div.ak-container.ak-panel.ak-crafts').find('div.ak-panel-content').find('div.ak-container.ak-content-list').find('div.ak-column').each(function (i, element) {
      var setUrl = 'https://www.dofus-touch.com' + $(this).find('div.ak-title').find('a').attr('href');
      var setId = $(this).find('div.ak-title').find('a').attr('href').replace(/\D/g, '');
      var setImage = $(this).find('div.ak-image').find('a').find('span.ak-linker').find('img').attr('src').replace('dofus/ng/img/../../../', '');
      var setQuantity = $(this).find('div.ak-front').text().replace(/\x/g, '').trim();
      var setName = $(this).find('div.ak-content').find('div.ak-title').find('a').find('span.ak-linker').text().trim();
      var setType = $(this).find('div.ak-content').find('div.ak-text').text().trim();
      var setLvl = $(this).find('div.ak-aside').text().replace(/\D/g, '').trim();

      var groupeElement = {
        [setName]: {
          'id': parseInt(setId, 10),
          'url': setUrl,
          'imgUrl': setImage,
          'type': setType,
          'lvl': parseInt(setLvl, 10),
          'quantity': parseInt(setQuantity, 10)
        }
      };
      item.push(groupeElement);
    });
    return item;
  },

  descriptionParse: (body, url) => {
    var $ = cheerio.load(body);
    var itemId = getId(url);
    $typeSelector = $('div.ak-encyclo-block-info').find('div.ak-encyclo-detail-type').find('span');
    if ($typeSelector.html() !== null) var type = $typeSelector.text().trim();
    else var type = $('div.ak-encyclo-detail-right').find('div.ak-encyclo-detail-type').text().trim().split(':')[1].trim();
    var name = $('h1.ak-return-link').text().trim();
    $descriptor = $('div.ak-encyclo-detail-right.ak-nocontentpadding').find('div.ak-container.ak-panel').first().find('div.ak-panel-content');
    $lvlSelector = $('div.ak-encyclo-detail-right').find('div.ak-encyclo-detail-level.col-xs-6.text-right');
    if (typeof $descriptor !== 'undefined') var description = $descriptor.text().trim(), description = sanatizer(description);
    if (typeof $lvlSelector !== 'undefined') var lvl = $lvlSelector.text().trim().replace(/\D/g, '');
    var imgUrl = $('div.ak-encyclo-detail-illu').find('img').attr('src').replace('dofus/ng/img/../../../', '');

    var item = {
      _id: itemId,
      name: name,
      type: type,
      imgUrl: imgUrl,
      url: url
    }
    if ($descriptor.html() !== null) item.description = description;
    if ($lvlSelector.html() !== null) item.lvl = parseInt(lvl, 10);
    return item;
  },

  monsterParse: (body, url) => {
    var $ = cheerio.load(body);
    var itemId = getId(url);
    $typeSelector = $('div.ak-encyclo-block-info').find('div.ak-encyclo-detail-type').find('span');
    if ($typeSelector.html() !== null) var type = $typeSelector.text().trim();
    else var type = $('div.ak-encyclo-detail-right').find('div.ak-encyclo-detail-type').text().trim().split(':')[1].trim();
    var name = $('h1.ak-return-link').text().trim();
    var imgUrl = $('div.ak-encyclo-detail-illu').find('img').attr('src');
    if(imgUrl == undefined){
      imgUrl = $('div.ak-encyclo-detail-illu').find('img').attr('data-src');
    }
    if(imgUrl != undefined){
      imgUrl = imgUrl.replace('dofus/ng/img/../../../', '');
    }
    var monstre = {
      _id: itemId,
      name: name,
      type: type,
      imgUrl: imgUrl,
      url: url
    }
    return monstre;
  },

  getCategoryType: (type) => {
    var glType = null;
    switch (true) {
      case /\b(chapeau|hat)\b/gi.test(type):
        glType = 'equipments';
        break;
      case /\b(cloak|cape)\b/gi.test(type):
        glType = 'equipments';
        break;
      case /\b(amulet|amulette)\b/gi.test(type):
        glType = 'equipments';
        break;
      case /\b(boots|bottes)\b/gi.test(type):
        glType = 'equipments';
        break;
      case /\b(ring|anneau)\b/gi.test(type):
        glType = 'equipments';
        break;
      case /\b(belt|ceinture)\b/gi.test(type):
        glType = 'equipments';
        break;
      case /\b(backpack|sac a dos)\b/gi.test(type):
        glType = 'equipments';
        break;
      case /\b(shield|bouclier)\b/gi.test(type):
        glType = 'equipments';
        break;
      case /\b(trophy|trophee)\b/gi.test(type):
        glType = 'equipments';
        break;
      case /\b(pet|familier)\b/gi.test(type):
        glType = 'equipments';
        break;
      case /\bdofus\b/gi.test(type):
        glType = 'equipments';
        break;
      case /\b(objet d'apparat|ceremonial item)\b/gi.test(type):
        glType = 'equipments';
        break;
      case /\b(sword|epee)\b/gi.test(type):
        glType = 'weapons';
        break;
      case /\b(dagger|dague)\b/gi.test(type):
        glType = 'weapons';
        break;
      case /\b(axe|hache)\b/gi.test(type):
        glType = 'weapons';
        break;
      case /\b(bow|arc)\b/gi.test(type):
        glType = 'weapons';
        break;
      case /\b(hammer|marteau)\b/gi.test(type):
        glType = 'weapons';
        break;
      case /\b(pickaxe|pioche)\b/gi.test(type):
        glType = 'weapons';
        break;
      case /\b(scythe|faux)\b/gi.test(type):
        glType = 'weapons';
        break;
      case /\b(shovel|pelle)\b/gi.test(type):
        glType = 'weapons';
        break;
      case /\b(soul stone|pierre d'ame)\b/gi.test(type):
        glType = 'weapons';
        break;
      case /\b(staff|baton)\b/gi.test(type):
        glType = 'weapons';
        break;
      case /\b(tool|outil)\b/gi.test(type):
        glType = 'weapons';
        break;
      case /\b(wand|baguette)\b/gi.test(type):
        glType = 'weapons';
        break;
      default:
        console.log('\x1b[31m%s\x1b[0m', 'Sorry, we are out of ' + type + '.');
    }
    return glType;
  }
};
