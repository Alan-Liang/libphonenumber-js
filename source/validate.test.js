import metadata from '../metadata.min.json'
import validate from './validate'

function is_valid_number(...parameters)
{
	parameters.push(metadata)
	return validate.apply(this, parameters)
}

describe('validate', () =>
{
	it('should validate phone numbers', function()
	{
		is_valid_number('+1-213-373-4253').should.equal(true)
		is_valid_number('+1-213-373').should.equal(false)

		is_valid_number('+1-213-373-4253', undefined).should.equal(true)

		is_valid_number('(213) 373-4253', 'US').should.equal(true)
		is_valid_number('(213) 37', 'US').should.equal(false)

		is_valid_number({ country: 'US', phone: '2133734253' }).should.equal(true)

		// No "types" info: should return `true`.
		is_valid_number('+380972423740').should.equal(true)

		is_valid_number('0912345678', 'TW').should.equal(true)

		// Moible numbers starting 07624* are Isle of Man
		// which has its own "country code" "IM"
		// which is in the "GB" "country calling code" zone.
		// So while this number is for "IM" it's still supposed to
		// be valid when passed "GB" as a default country.
		is_valid_number('07624369230', 'GB').should.equal(true)
	})

	it('should refine phone number validation in case extended regular expressions are set for a country', () =>
	{
		// Germany general validation must pass
		is_valid_number('961111111', 'UZ').should.equal(true)

		// Different regular expressions for precise national number validation.
		// `types` index in compressed array is `9` for v1.
		// For v2 it's 10.
		// For v3 it's 11.
		metadata.countries.UZ[11] =
		[
			["(?:6(?:1(?:22|3[124]|4[1-4]|5[123578]|64)|2(?:22|3[0-57-9]|41)|5(?:22|3[3-7]|5[024-8])|6\\d{2}|7(?:[23]\\d|7[69])|9(?:22|4[1-8]|6[135]))|7(?:0(?:5[4-9]|6[0146]|7[12456]|9[135-8])|1[12]\\d|2(?:22|3[1345789]|4[123579]|5[14])|3(?:2\\d|3[1578]|4[1-35-7]|5[1-57]|61)|4(?:2\\d|3[1-579]|7[1-79])|5(?:22|5[1-9]|6[1457])|6(?:22|3[12457]|4[13-8])|9(?:22|5[1-9])))\\d{5}"],
			["6(?:1(?:2(?:98|2[01])|35[0-4]|50\\d|61[23]|7(?:[01][017]|4\\d|55|9[5-9]))|2(?:11\\d|2(?:[12]1|9[01379])|5(?:[126]\\d|3[0-4])|7\\d{2})|5(?:19[01]|2(?:27|9[26])|30\\d|59\\d|7\\d{2})|6(?:2(?:1[5-9]|2[0367]|38|41|52|60)|3[79]\\d|4(?:56|83)|7(?:[07]\\d|1[017]|3[07]|4[047]|5[057]|67|8[0178]|9[79])|9[0-3]\\d)|7(?:2(?:24|3[237]|4[5-9]|7[15-8])|5(?:7[12]|8[0589])|7(?:0\\d|[39][07])|9(?:0\\d|7[079]))|9(?:2(?:1[1267]|5\\d|3[01]|7[0-4])|5[67]\\d|6(?:2[0-26]|8\\d)|7\\d{2}))\\d{4}|7(?:0\\d{3}|1(?:13[01]|6(?:0[47]|1[67]|66)|71[3-69]|98\\d)|2(?:2(?:2[79]|95)|3(?:2[5-9]|6[0-6])|57\\d|7(?:0\\d|1[17]|2[27]|3[37]|44|5[057]|66|88))|3(?:2(?:1[0-6]|21|3[469]|7[159])|33\\d|5(?:0[0-4]|5[579]|9\\d)|7(?:[0-3579]\\d|4[0467]|6[67]|8[078])|9[4-6]\\d)|4(?:2(?:29|5[0257]|6[0-7]|7[1-57])|5(?:1[0-4]|8\\d|9[5-9])|7(?:0\\d|1[024589]|2[0127]|3[0137]|[46][07]|5[01]|7[5-9]|9[079])|9(?:7[015-9]|[89]\\d))|5(?:112|2(?:0\\d|2[29]|[49]4)|3[1568]\\d|52[6-9]|7(?:0[01578]|1[017]|[23]7|4[047]|[5-7]\\d|8[78]|9[079]))|6(?:2(?:2[1245]|4[2-4])|39\\d|41[179]|5(?:[349]\\d|5[0-2])|7(?:0[017]|[13]\\d|22|44|55|67|88))|9(?:22[128]|3(?:2[0-4]|7\\d)|57[05629]|7(?:2[05-9]|3[37]|4\\d|60|7[2579]|87|9[07])))\\d{4}|9[0-57-9]\\d{7}"]
		]

		// Extended validation must not pass for an invalid phone number
		is_valid_number('961111111', 'UZ').should.equal(false)

		// Extended validation must pass for a valid phone number
		is_valid_number('912345678', 'UZ').should.equal(true)
	})

	it('should work in edge cases', function()
	{
		// No metadata
		let thrower = () => validate('+78005553535')
		thrower.should.throw('`metadata` argument not passed')

		// Non-phone-number characters in a phone number
		is_valid_number('+499821958a').should.equal(false)
		is_valid_number('88005553535x', 'RU').should.equal(false)

		// Doesn't have `types` regexps in default metadata.
		is_valid_number({ country: 'UA', phone: '300000000' }).should.equal(true)
		is_valid_number({ country: 'UA', phone: '200000000' }).should.equal(false)

		// Numerical `value`
		thrower = () => is_valid_number(88005553535, 'RU')
		thrower.should.throw('A phone number must either be a string or an object of shape { phone, [country] }.')

		// Long country phone code
		is_valid_number('+3725555555').should.equal(true)

		// Invalid country
		thrower = () => is_valid_number({ phone: '8005553535', country: 'RUS' })
		thrower.should.throw('Unknown country')
	})

	it('should accept phone number extensions', function()
	{
		// International
		is_valid_number('+12133734253 ext. 123').should.equal(true)
		// National
		is_valid_number('88005553535 x123', 'RU').should.equal(true)
	})
})