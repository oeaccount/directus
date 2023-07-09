import type { AbstractQueryNodeSortTargets } from '@directus/data';
import type { GeoJSONGeometry } from 'wellknown';

export interface AbstractSqlQueryColumn {
	table: string;
	column: string;
}

export interface AbstractSqlQuerySelectNode extends AbstractSqlQueryColumn {
	type: 'primitive';

	/* This can only be applied when using the function it within the SELECT clause */
	as?: string;
}

export interface AbstractSqlQueryFnNode {
	type: 'fn';

	/* Same as the the abstract functions @todo: add restrictions */
	fn: string;

	input: AbstractSqlQuerySelectNode;

	isTimestampType?: boolean;

	/* Indexes of additional arguments within the parameter list  */
	arguments?: ValueNode;

	/* This can only be applied when using the function it within the SELECT clause */
	as?: string;
}

/** @TODO */
// export interface SqlStatementSelectJson {
// 	type: 'json';
// 	table: string;
// 	column: string;
// 	as?: string;
// 	path: string;
// }

/**
 * Used for parameterized queries.
 */
type ParameterIndex = {
	/** Indicates where the actual value is stored in the parameter array */
	parameterIndex: number;
};

/**
 * This is an abstract SQL query which can be passed to all SQL drivers.
 *
 * @example
 * ```ts
 * const query: SqlStatement = {
 *  select: [id],
 *  from: 'articles',
 *  limit: 0,
 * 	parameters: [25],
 * };
 * ```
 */
export interface AbstractSqlQuery {
	type: 'query';
	root?: boolean;
	select: (AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode)[];
	from: string;
	join?: AbstractSqlQueryJoinNode[];
	limit?: ParameterIndex;
	offset?: ParameterIndex;
	order?: AbstractSqlQueryOrderNode[];
	where?: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;
	parameters: ParameterTypes[];
	/**
	 * SQL returns data as a flat object. This map contains the flat property names and the JSON path
	 * they correspond to.
	 */
	paths: Map<string, string[]>;
}

export type ParameterTypes = string | boolean | number | GeoJSONGeometry;

type AbstractSqlQueryNodeType = 'order' | 'join' | 'condition' | 'logical' | 'value';

/**
 * All nodes which can be used within the `nodes` array of the `AbstractQuery` have a type attribute.
 * With this in place it can easily be determined how to technically handle this field.
 * @see `AbstractQueryNodeType` for all possible types.
 */
interface AbstractSqlQueryNode {
	/** the type of the node */
	type: AbstractSqlQueryNodeType;
}

export interface AbstractSqlQueryOrderNode extends AbstractSqlQueryNode {
	type: 'order';
	orderBy: AbstractQueryNodeSortTargets;
	direction: 'ASC' | 'DESC';
}

export interface AbstractSqlQueryJoinNode extends AbstractSqlQueryNode {
	type: 'join';
	table: string;
	on: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;
	as: string;
}

export interface AbstractSqlQueryConditionNode extends AbstractSqlQueryNode {
	type: 'condition';

	/* value which will be compared to another value or expression. */
	target: AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode;

	/* an abstract comparator */
	operation:
		| 'eq'
		| 'lt'
		| 'lte'
		| 'gt'
		| 'gte'
		| 'in'
		| 'contains'
		| 'starts_with'
		| 'ends_with'
		| 'intersects'
		| 'every'
		| 'some';

	/* indicated of the condition should be negated using NOT */
	negate: boolean;

	/**
	 * The node to which the target should be be compared.
	 * Can be a value, a column or a sub query.
	 */
	compareTo: CompareToNodeTypes;
}

export type CompareToNodeTypes = ValueNode | AbstractSqlQuerySelectNode | AbstractSqlQuery;

export interface AbstractSqlQueryLogicalNode extends AbstractSqlQueryNode {
	type: 'logical';
	operator: 'and' | 'or';
	negate: boolean;
	childNodes: (AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode)[];
}

export interface ValueNode {
	type: 'value';
	parameterIndexes: number[];
}

/**
 * An actual vendor specific SQL statement with its parameters.
 * @example
 * ```
 * {
 * 		statement: 'SELECT * FROM "articles" WHERE "articles"."id" = $1;',
 * 		values: [99],
 * }
 * ```
 */
export interface ParameterizedSqlStatement {
	statement: string;
	parameters: (string | number | boolean)[];
}
