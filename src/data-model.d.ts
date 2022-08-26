interface Case<T extends JsonSchemaTarget = 'validator'> extends OptionalNotes, OptionalUrls {
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
		/**
		 * @format date
		 */
		firstPurchase?: string;

		// This is an arbitrary string to allow freeform text such as "The third Thursday in December".
		fiscalCalendar: string;
	};
	partners: OrganizationType<T>[];
	// portfolioHeatMap: HeatMap<'cloud' | 'core' | 'threatInsight'>;
	products: Product[];
	projects: Project[];
	risks: Risk[];
	salesTeam: T extends 'editor' ? ReferenceOr<Person<T>[]> : Person<T>[];
	todos: ToDos;
	topics: Topic[];
}

type DataModelEditor = DataModelType<'editor'>;
type DataModel = DataModelType<'validator'>;

type HeatMap<T extends PropertyKey> = Record<T, HeatMapValue>;

type HeatMapColor = 'green' | 'yellow' | 'red';

interface HeatMapValue extends OptionalNotes {
	color: HeatMapColor;
}

type JsonSchemaTarget = 'editor' | 'validator';

interface Location extends OptionalNotes {
	host?: string;
	name: string;
	location?: string;
	usingGigamon?: boolean;
}

interface Meeting<T extends JsonSchemaTarget = 'validator'> {
	/**
	 * @format date
	 */
	date: T extends 'editor' ? string | undefined : string;
	frequency: MeetingFrequency;
	invitees: Person<T>[];
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
interface PersonType extends OptionalPhones, OptionalUrls {
	/**
	 * @format email
	 */
	email?: string;
	name: string;
	portalUser?: boolean;
	team: string;
	title?: string;
	specialties?: string[];
}

type Person<T extends JsonSchemaTarget = 'validator'> = T extends 'editor'
	? ReferenceOr<PersonType>
	: PersonType;

type PhoneName = 'mobile' | 'office';

interface Product extends OptionalNotes {
	function: string;
	product?: string;
	type?: ProductType;
}

type ProductType = 'infrastructure' | 'soc-triad' | 'gigamon-fed';

interface Project extends OptionalNotes, OptionalTask {
	project: string;
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
