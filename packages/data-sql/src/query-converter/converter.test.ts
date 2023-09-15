import type { AbstractQuery, AbstractQueryFieldNodePrimitive } from '@directus/data';
import { beforeEach, expect, test } from 'vitest';
import type { AbstractSqlQuery } from '../types/index.js';
import { convertToAbstractSqlQueryAndGenerateAliases } from './converter.js';
import { randomIdentifier, randomInteger } from '@directus/random';

let sample: {
	query: AbstractQuery;
};

beforeEach(() => {
	sample = {
		query: {
			root: true,
			store: randomIdentifier(),
			collection: randomIdentifier(),
			nodes: [
				{
					type: 'primitive',
					field: randomIdentifier(),
				},
				{
					type: 'primitive',
					field: randomIdentifier(),
				},
			],
		},
	};
});

test('Convert simple query', () => {
	const res = convertToAbstractSqlQueryAndGenerateAliases(sample.query);

	const expected: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[0] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[1] as AbstractQueryFieldNodePrimitive).field,
			},
		],
		from: sample.query.collection,
		parameters: [],
	};

	expect(res.sql).toMatchObject(expected);
});

test('Convert query with filter', () => {
	const randomField = randomIdentifier();
	const compareToValue = randomInteger(1, 100);

	sample.query.modifiers = {
		filter: {
			type: 'condition',
			condition: {
				type: 'condition-number',
				target: {
					type: 'primitive',
					field: randomField,
				},
				operation: 'gt',
				compareTo: compareToValue,
			},
		},
	};

	const res = convertToAbstractSqlQueryAndGenerateAliases(sample.query);

	const expected: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[0] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[1] as AbstractQueryFieldNodePrimitive).field,
			},
		],
		from: sample.query.collection,
		where: {
			type: 'condition',
			negate: false,
			condition: {
				type: 'condition-number',
				target: {
					column: randomField,
					table: sample.query.collection,
					type: 'primitive',
				},
				operation: 'gt',
				compareTo: {
					type: 'value',
					parameterIndex: 0,
				},
			},
		},
		parameters: [compareToValue],
	};

	expect(res.sql).toMatchObject(expected);
});

test('Convert query with a limit', () => {
	sample.query.modifiers = {
		limit: {
			type: 'limit',
			value: randomInteger(1, 100),
		},
	};

	const res = convertToAbstractSqlQueryAndGenerateAliases(sample.query);

	const expected: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[0] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[1] as AbstractQueryFieldNodePrimitive).field,
			},
		],
		from: sample.query.collection,
		limit: { type: 'value', parameterIndex: 0 },
		parameters: [sample.query.modifiers.limit!.value],
	};

	expect(res.sql).toMatchObject(expected);
});

test('Convert query with limit and offset', () => {
	sample.query.modifiers = {
		limit: {
			type: 'limit',
			value: randomInteger(1, 100),
		},
		offset: {
			type: 'offset',
			value: randomInteger(1, 100),
		},
	};

	const res = convertToAbstractSqlQueryAndGenerateAliases(sample.query);

	const expected: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[0] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[1] as AbstractQueryFieldNodePrimitive).field,
			},
		],
		from: sample.query.collection,
		limit: { type: 'value', parameterIndex: 0 },
		offset: { type: 'value', parameterIndex: 1 },
		parameters: [sample.query.modifiers.limit!.value, sample.query.modifiers.offset!.value],
	};

	expect(res.sql).toMatchObject(expected);
});

test('Convert query with a sort', () => {
	sample.query.modifiers = {
		sort: [
			{
				type: 'sort',
				direction: 'ascending',
				target: {
					type: 'primitive',
					field: randomIdentifier(),
				},
			},
		],
	};

	const res = convertToAbstractSqlQueryAndGenerateAliases(sample.query);

	const expected: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[0] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[1] as AbstractQueryFieldNodePrimitive).field,
			},
		],
		from: sample.query.collection,
		order: [
			{
				type: 'order',
				orderBy: sample.query.modifiers.sort![0]!.target,
				direction: 'ASC',
			},
		],
		parameters: [],
	};

	expect(res.sql).toMatchObject(expected);
});

test('Convert a query with a function as field select', () => {
	const randomField = randomIdentifier();

	sample.query.nodes.push({
		type: 'fn',
		fn: {
			type: 'arrayFn',
			fn: 'count',
		},
		field: randomField,
	});

	const res = convertToAbstractSqlQueryAndGenerateAliases(sample.query);

	const expected: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[0] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[1] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'fn',
				fn: {
					type: 'arrayFn',
					fn: 'count',
				},
				table: sample.query.collection,
				column: randomField,
			},
		],
		from: sample.query.collection,
		parameters: [],
	};

	expect(res.sql).toMatchObject(expected);
});

test('Convert a query with all possible modifiers', () => {
	sample.query.modifiers = {
		limit: {
			type: 'limit',
			value: randomInteger(1, 100),
		},
		offset: {
			type: 'offset',
			value: randomInteger(1, 100),
		},
		sort: [
			{
				type: 'sort',
				direction: 'ascending',
				target: {
					type: 'primitive',
					field: randomIdentifier(),
				},
			},
		],
	};

	const res = convertToAbstractSqlQueryAndGenerateAliases(sample.query);

	const expected: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[0] as AbstractQueryFieldNodePrimitive).field,
			},
			{
				type: 'primitive',
				table: sample.query.collection,
				column: (sample.query.nodes[1] as AbstractQueryFieldNodePrimitive).field,
			},
		],
		from: sample.query.collection,
		order: [
			{
				type: 'order',
				orderBy: sample.query.modifiers.sort![0]!.target,
				direction: 'ASC',
			},
		],
		limit: { type: 'value', parameterIndex: 0 },
		offset: { type: 'value', parameterIndex: 1 },
		parameters: [sample.query.modifiers.limit!.value, sample.query.modifiers.offset!.value],
	};

	expect(res.sql).toMatchObject(expected);
});