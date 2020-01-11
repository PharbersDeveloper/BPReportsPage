import Component from '@ember/component';
import layout from '../templates/components/bp-icon';
import { computed } from '@ember/object';
export default Component.extend({
    layout,
    tagName: 'div',
    classNames: ['bp-icon'],
    content: 'default',
    attributeBindings: [''],
    value: 12.2,
    color: null, iconSmall: true,
    iconName: computed('value', function () { if (this.get('value') > 0) { return 'priority-high' } else { return 'priority-low' } }),
    classNameBindings: ['iconSmall:icon-small:'],
});
