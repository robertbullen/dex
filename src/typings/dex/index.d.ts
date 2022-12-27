declare module 'dex' {
	interface Case<T extends JsonSchemaTarget = 'validator'>
		extends OptionalNotes,
			OptionalSalesforceId,
			OptionalUrls {
		contact: ReferenceOr<Person<T>>;

		/**
		 * @format date
		 */
		dateOpened: string;

		// /**
		//  * @format date
		//  */
		// dateUpdated: string;

		number: string;
		status: CaseStatus;
		subject: string;
	}

	type CaseStatus = 'closed' | 'open' | 'resolved';

	/**
	 * This is an internal type. Use `DataModelEditor` or `DataModel` instead.
	 */
	interface DataModelType<T extends JsonSchemaTarget = 'validator'> extends OrganizationType<T> {
		cases: Case<T>[];
		gigamon: T extends 'editor' ? never : OrganizationType<T>;
		locations: Location[];
		meeting: Meeting<T>;
		notableDates: {
			name: string;
			when: string;
		}[];
		partners: OrganizationType<T>[];
		// portfolioHeatMap: HeatMap<'cloud' | 'core' | 'threatInsight'>;
		products: Product[];
		projects: Project[];
		quotes: Quote[];
		risks: Risk[];
		salesTeam: T extends 'editor' ? ReferenceOr<Person<T>[]> : Person<T>[];
		todos: ToDos;
		topics: Topic[];
	}

	type DataModelEditor = DataModelType<'editor'>;
	type DataModel = DataModelType<'validator'>;

	type GigamonIntegration = 'active' | 'inactive';

	type HeatMap<T extends PropertyKey> = Record<T, HeatMapValue>;

	type HeatMapColor = 'green' | 'yellow' | 'red';

	interface HeatMapValue extends OptionalNotes {
		color: HeatMapColor;
	}

	type JsonSchemaTarget = 'editor' | 'validator';

	interface Location extends OptionalNotes {
		gigamonIntegration?: GigamonIntegration;
		host?: string;
		name: string;
		location?: string;
	}

	interface Meeting<T extends JsonSchemaTarget = 'validator'> {
		/**
		 * @format date
		 */
		date: T extends 'editor' ? string | undefined : string;
		frequency: MeetingFrequency;
		invitees: Person<T>[];
		noteworthyPeople?: Person<T>[];
	}

	type MeetingFrequency = 'biweekly' | 'monthly' | 'quarterly' | 'weekly';

	interface OptionalNotes {
		notes?: string[];
	}

	interface OptionalPhones {
		phone?: string;
		phones?: {
			name: PhoneName;
			phone: string;
		}[];
	}

	interface OptionalSalesforceId {
		sfid?: string;
	}

	interface OptionalTask {
		complete?: boolean;
		hidden?: boolean;
	}

	interface OptionalUrls {
		/**
		 * @format uri
		 */
		url?: string;
		urls?: {
			name: string;

			/**
			 * @format uri
			 */
			url: string;
		}[];
	}

	interface OrganizationType<T extends JsonSchemaTarget = 'validator'> {
		orgChartDirection?: 'LR' | 'TB';
		orgChartJustification?: 'roots' | 'leaves';
		orgName: string;
		people?: PeopleDictionary<T>;
		staff: StaffMember<T>[];
	}

	type OrganizationEditor = OrganizationType<'editor'>;
	type Organization = OrganizationType<'validator'>;

	type PeopleDictionary<T extends JsonSchemaTarget = 'validator'> = Record<string, Person<T>>;

	/**
	 * This is an internal type. Use `Person` instead.
	 */
	interface PersonType extends OptionalNotes, OptionalPhones, OptionalSalesforceId, OptionalUrls {
		/**
		 * @format email
		 */
		email?: string;
		name: string;
		portalUser?: boolean;
		specialties?: string[];
		team: string;
		title?: string;
	}

	type Person<T extends JsonSchemaTarget = 'validator'> = T extends 'editor'
		? ReferenceOr<PersonType>
		: PersonType;

	type PhoneName = 'mobile' | 'office';

	interface Product extends OptionalNotes {
		function: string;
		gigamonIntegration?: GigamonIntegration;
		product?: string;
		type?: ProductType;
	}

	type ProductType = 'infrastructure' | 'soc-triad';

	interface Project extends OptionalNotes, OptionalTask {
		project: string;
	}

	interface Quote extends OptionalNotes, OptionalSalesforceId {
		number: string;
		quote: string;

		/**
		 * @format date
		 */
		deliveryDate?: string;

		/**
		 * @format date
		 */
		expiryDate?: string;
	}

	type ReferenceOr<T> =
		| T
		| {
				/**
				 * @format json-pointer
				 */
				$ref: string;
		  };

	interface Risk extends OptionalNotes, OptionalTask {
		risk: string;
	}

	interface StaffMember<T extends JsonSchemaTarget = 'validator'> {
		person: Person<T>;
		staff?: StaffMember<T>[];
	}

	interface ToDo extends OptionalNotes, OptionalTask {
		assignee: string;
		todo: string;
	}

	interface ToDos {
		gigamon?: ToDo[];
		customer?: ToDo[];
	}

	interface Topic extends OptionalNotes, OptionalTask {
		topic: string;
	}
}
