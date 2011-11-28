// Array.isArray fix for older Firefoxes (suggested by https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray)
if(!Array.isArray) {
	Array.isArray = function (arg) {  
		return Object.prototype.toString.call(arg) == '[object Array]';  
	};  
}

function TraverseCore() {
	this.ActionTable = {};
	this.ChoiceResults = {};
	this.HL = new TraverseHL(this);
	this.DSL = new TraverseDSL(this);
}

TraverseCore.prototype =
{
	Action: function( name, results, predicates ) {
		var action = new TraverseAction(name, results, predicates);
		this.ActionTable[name] = action;
		return action;
	},
	
	ResolveAction: function(nameOrAction)
	{
		if ( typeof( nameOrAction ) == 'string' )
			return this.ActionTable[nameOrAction];
		return nameOrAction;
	},
	
	GetOnceSetter: function( name )
	{
		var choiceResults = this.ChoiceResults;
		choiceResults[name] = false;
		return [
			[ function() { choiceResults[name] = true; }, function(){return true;} ]
		];
	},
	
	ChoiceMade: function( name )
	{
		var choiceResults = this.ChoiceResults;
		return function(){ return choiceResults[name]; };
	},
	
	ChoiceNotMade: function( name )
	{
		var choiceResults = this.ChoiceResults;
		return function(){ return !choiceResults[name]; };
	},
	
	GetAllEligibleActions: function()
	{
		var result = [];
		for ( var actName in this.ActionTable )
		{
			var act = this.ResolveAction( actName );
			if ( act.IsEligible() )
				result.push( act );
		}
		return result;
	},
	
	GetOnceAction: function( name, results, predicates )
	{
		return this.Action( name, results.concat( this.GetOnceSetter( name ) ), predicates.concat( this.ChoiceNotMade( name ) ) );
	}
}

function TraverseAction( name, results, predicates )
{
	this.Name = name;
	this.Results = results;
	this.Predicates = predicates;
}

TraverseAction.prototype =
{
	Run: function()
	{
		if ( this.IsEligible() )
			for ( var i in this.Results )
			{
				if ( this.Results[i][1]() )
					this.Results[i][0]();
			}
		else
			throw "Can't run " + this.Name;
	},
	IsEligible: function()
	{
		var OK = true;
		if ( this.Predicates != null )
			for ( var i in this.Predicates )
				OK = OK && this.Predicates[i]();
		return OK;
	},
	AddResult: function( f )
	{
		this.Results.push( f );
	},
	AddPredicate: function ( f )
	{
		this.Predicates.push( f );
	}
};

function TraverseHL(core) {
	this.Core = core;
}

TraverseHL.prototype.CreateChoice = function( name, actionInitializers, predicates, additionalResults )
{
	var createdActions = [];
	for ( var i in actionInitializers )
	{
		var fullName = actionInitializers[i].Name;
		var specificPredicates = actionInitializers[i].Predicates;
		specificPredicates = Array.isArray( specificPredicates ) ? specificPredicates : [];
		createdActions.push( this.Core.Action( fullName, actionInitializers[i].Results.concat( this.GetChoiceSetter( name, fullName ) ).concat( additionalResults ), specificPredicates.concat( predicates ).concat( this.GetChoicePredicates( name ) ) ) );
	}
	return createdActions;
};

TraverseHL.prototype.GetChoiceSetter = function( name, fullName )
{
	return this.Core.GetOnceSetter( name ).concat( this.Core.GetOnceSetter( fullName ) );
};

TraverseHL.prototype.GetChoicePredicates = function( name )
{
	return [ this.Core.ChoiceNotMade( name ) ];
};

function TraverseDSL(core) {
	this.Core = core;
}

TraverseDSL.prototype.Option = function( name, optionalPredicate )
{
	var optionalResults = Array.prototype.slice.call(arguments).slice( 2 );
	var predicates = typeof(optionalPredicate == 'function') ? [ optionalPredicate ] : [];
	return { "Name":name, "Results":optionalResults, "Predicates":predicates };
};

TraverseDSL.prototype.Options = function() {
	var result = [];
	var myOptions;
	if ( Array.isArray( arguments[0] ) )
		myOptions = arguments[0];
	else
		myOptions = Array.prototype.slice.call(arguments);
	for ( var i = 0 ; i < myOptions.length ; i++ )
		if ( typeof( myOptions[i] ) == 'string' )
			result.push( { "Name":myOptions[i], "Results":[], "Predicates":[] } );
		else
			result.push( myOptions[i] );
	return result;
};

TraverseDSL.prototype.OnlyIf = function( p )
{
	if ( typeof(p) == 'string' )
		return this.Core.ChoiceMade( p );
	return p;
};

TraverseDSL.prototype.AndThen = function( r, maybePredicate )
{
	if ( Array.isArray( r ) )
		return r;
	var result = ( typeof(r) == 'string' ) ? this.Core.GetOnceSetter( r )[0] : r;
	if ( maybePredicate != undefined && maybePredicate != null )
		result = [ result, this.OnlyIf( maybePredicate ) ];
	else
		result = [ result, function(){return true;} ];
	return result;
};

TraverseDSL.prototype.Choice = function( name ) {
	var results = [];
	var myArgs = Array.prototype.slice.call(arguments).slice(1);
	while ( Array.isArray( myArgs[ myArgs.length - 1 ] ) )
		results.push( myArgs.pop() );

	return this.Core.HL.CreateChoice( name, this.Options( myArgs ), [], results );
};

TraverseDSL.prototype.After = function( maybePredicate, maybeActions, maybeResult )
{
	var p = this.OnlyIf( maybePredicate );
	var as = Array.isArray( maybeActions ) ? maybeActions : [ maybeActions ];
	var r = this.AndThen( maybeResult );
	for ( var i in as )
	{
		as[i].AddPredicate( p );
		if ( maybeResult != undefined && maybeResult != null )
			as[i].AddResult( r );
	}
}

TraverseDSL.prototype.AnyOf = function()
{
	var dsl = this;
	var predicates = arguments;
	return function()
	{
		for ( var i = 0; i < predicates.length; i++ )
			if ( dsl.OnlyIf( predicates[ i ] )() )
				return true;
		return false;
	};
}
TraverseDSL.prototype.EitherOf = TraverseDSL.prototype.AnyOf;
	
TraverseDSL.prototype.AllOf = function()
{
	var dsl = this;
	var predicates = Array.prototype.slice.call( arguments );
	return function()
	{
		for ( var i = 0; i < predicates.length ; i++ )
			if ( !dsl.OnlyIf( predicates[ i ] )() )
				return false;
		return true;
	};
}
TraverseDSL.prototype.BothOf = TraverseDSL.prototype.AllOf;	