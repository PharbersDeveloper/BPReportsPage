import DS from 'ember-data';

export default DS.Model.extend({
    type: DS.attr("string"),
    canSave: DS.attr("boolean"),
    canEdit: DS.attr("boolean"),
    url: DS.attr("string"),
    expires: DS.attr("string"),
    created: DS.attr("string"),
    updated: DS.attr("string"),
    version: DS.attr("number"),
    description: DS.attr("string")
});
