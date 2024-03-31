export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					operationName?: string;
					query?: string;
					variables?: Json;
					extensions?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			classes: {
				Row: {
					id: string;
					name: string;
					room: string;
					teacher_first: string;
					teacher_last: string;
				};
				Insert: {
					id?: string;
					name: string;
					room: string;
					teacher_first: string;
					teacher_last: string;
				};
				Update: {
					id?: string;
					name?: string;
					room?: string;
					teacher_first?: string;
					teacher_last?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'classes_room_fkey';
						columns: ['room'];
						referencedRelation: 'rooms';
						referencedColumns: ['id'];
					}
				];
			};
			rooms: {
				Row: {
					created_at: string | null;
					id: string;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
				};
				Update: {
					created_at?: string | null;
					id?: string;
				};
				Relationships: [];
			};
			schedules: {
				Row: {
					'1a': string;
					'1b': string;
					'2a': string;
					'2b': string;
					'3a': string;
					'3b': string;
					'4a': string;
					'4b': string;
					room: string;
					student: string;
				};
				Insert: {
					'1a': string;
					'1b': string;
					'2a': string;
					'2b': string;
					'3a': string;
					'3b': string;
					'4a': string;
					'4b': string;
					room: string;
					student: string;
				};
				Update: {
					'1a'?: string;
					'1b'?: string;
					'2a'?: string;
					'2b'?: string;
					'3a'?: string;
					'3b'?: string;
					'4a'?: string;
					'4b'?: string;
					room?: string;
					student?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'schedules_1a_fkey';
						columns: ['1a'];
						referencedRelation: 'classes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'schedules_1b_fkey';
						columns: ['1b'];
						referencedRelation: 'classes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'schedules_2a_fkey';
						columns: ['2a'];
						referencedRelation: 'classes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'schedules_2b_fkey';
						columns: ['2b'];
						referencedRelation: 'classes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'schedules_3a_fkey';
						columns: ['3a'];
						referencedRelation: 'classes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'schedules_3b_fkey';
						columns: ['3b'];
						referencedRelation: 'classes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'schedules_4a_fkey';
						columns: ['4a'];
						referencedRelation: 'classes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'schedules_4b_fkey';
						columns: ['4b'];
						referencedRelation: 'classes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'schedules_room_fkey';
						columns: ['room'];
						referencedRelation: 'rooms';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	storage: {
		Tables: {
			buckets: {
				Row: {
					allowed_mime_types: string[] | null;
					avif_autodetection: boolean | null;
					created_at: string | null;
					file_size_limit: number | null;
					id: string;
					name: string;
					owner: string | null;
					owner_id: string | null;
					public: boolean | null;
					updated_at: string | null;
				};
				Insert: {
					allowed_mime_types?: string[] | null;
					avif_autodetection?: boolean | null;
					created_at?: string | null;
					file_size_limit?: number | null;
					id: string;
					name: string;
					owner?: string | null;
					owner_id?: string | null;
					public?: boolean | null;
					updated_at?: string | null;
				};
				Update: {
					allowed_mime_types?: string[] | null;
					avif_autodetection?: boolean | null;
					created_at?: string | null;
					file_size_limit?: number | null;
					id?: string;
					name?: string;
					owner?: string | null;
					owner_id?: string | null;
					public?: boolean | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			migrations: {
				Row: {
					executed_at: string | null;
					hash: string;
					id: number;
					name: string;
				};
				Insert: {
					executed_at?: string | null;
					hash: string;
					id: number;
					name: string;
				};
				Update: {
					executed_at?: string | null;
					hash?: string;
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			objects: {
				Row: {
					bucket_id: string | null;
					created_at: string | null;
					id: string;
					last_accessed_at: string | null;
					metadata: Json | null;
					name: string | null;
					owner: string | null;
					owner_id: string | null;
					path_tokens: string[] | null;
					updated_at: string | null;
					version: string | null;
				};
				Insert: {
					bucket_id?: string | null;
					created_at?: string | null;
					id?: string;
					last_accessed_at?: string | null;
					metadata?: Json | null;
					name?: string | null;
					owner?: string | null;
					owner_id?: string | null;
					path_tokens?: string[] | null;
					updated_at?: string | null;
					version?: string | null;
				};
				Update: {
					bucket_id?: string | null;
					created_at?: string | null;
					id?: string;
					last_accessed_at?: string | null;
					metadata?: Json | null;
					name?: string | null;
					owner?: string | null;
					owner_id?: string | null;
					path_tokens?: string[] | null;
					updated_at?: string | null;
					version?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'objects_bucketId_fkey';
						columns: ['bucket_id'];
						referencedRelation: 'buckets';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			can_insert_object: {
				Args: {
					bucketid: string;
					name: string;
					owner: string;
					metadata: Json;
				};
				Returns: undefined;
			};
			extension: {
				Args: {
					name: string;
				};
				Returns: string;
			};
			filename: {
				Args: {
					name: string;
				};
				Returns: string;
			};
			foldername: {
				Args: {
					name: string;
				};
				Returns: unknown;
			};
			get_size_by_bucket: {
				Args: Record<PropertyKey, never>;
				Returns: {
					size: number;
					bucket_id: string;
				}[];
			};
			search: {
				Args: {
					prefix: string;
					bucketname: string;
					limits?: number;
					levels?: number;
					offsets?: number;
					search?: string;
					sortcolumn?: string;
					sortorder?: string;
				};
				Returns: {
					name: string;
					id: string;
					updated_at: string;
					created_at: string;
					last_accessed_at: string;
					metadata: Json;
				}[];
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}
