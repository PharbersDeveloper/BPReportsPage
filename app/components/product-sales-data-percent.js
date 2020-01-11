import Component from '@ember/component';
import layout from '../templates/components/product-sales-data-percent';
import { computed } from '@ember/object';
export default Component.extend({
    layout,
    tagName: 'div',
    classNames: ['product-sales-data-percent'],
    content: 'default',
    attributeBindings: [''],
    value: 12.1,
    textColorRed: 'textColorRed',
    textColorRed: computed('value', function () { return this.get('value') < 0 }),
    classNameBindings: ['style', 'textColorRed:textColorRed',],
});
