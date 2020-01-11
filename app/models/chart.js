import DS from 'ember-data';

export default DS.Model.extend({
    styleConfigs: DS.attr(),
    dataConfigs: DS.attr(),
    otherConfigs: DS.attr(),
	metadata: DS.belongsTo( "metadata", { defaultValue: null } )
});
