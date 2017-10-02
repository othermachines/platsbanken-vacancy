

```
try {
  request
    .sender({
      id: 'CUSTOMER NUMBER,
      email: 'foo@bar.com',
    })
    .transaction({
      id: 'TRANSACTION GUID',
    })
    .jobPositionPosting({
      id: 'ORGANIZATION NUMBER-123',
      status: 'active',
    })
    .hiringOrg({
      name: 'COMPANY NAME',
      id: 'ORGANIZATION NUMBER',
      url: 'http://example.org',
    })
    .hiringOrgContact({
      countryCode: 'SE',
      postalCode: '11356',
      municipality: '0180',
      addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
      streetName: 'Birger Jarlsgatan 58',
    })
    .postDetail({
      startDate: '2018-09-01',
      endDate: '2018-12-01',
      recruiterName: 'Alex Smith',
      recruiterEmail: 'alexsmith@example.org',
    })
    .jobPositionTitle({
      title: 'JOB TITLE',
    })
    .jobPositionPurpose({
      purpose: 'JOB PURPOSE',
    })
    .jobPositionLocation({
      countryCode: 'SE',
      postalCode: '11356',
      municipality: '0180',
      addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
      streetName: 'Birger Jarlsgatan 58',
    })
    .classification({
      scheduleType: 'part',
      duration: 'temporary',
      scheduleSummaryText: 'Schedule Summary',
      durationSummaryText: 'Duration Summary',
      termLength: 2,
    })
    .compensationDescription({
      currency: 'SEK',
      salaryType: 1,
      benefits: 'bennies',
      summary: 'summary text',
    })
    .qualificationsRequiredSummary({
      summary: 'Summary of qualifications',
    })
    .qualification({
      type: 'license',
      description: 'DriversLicense',
      category: 'B',
    })
    .qualification({
      type: 'experience',
      yearsOfExperience: 1,
    })
    .qualification({
      type: 'equipment',
      description: 'Car',
    })
    .qualificationsPreferredSummary({
      summary: 'PREFERRED QUALIFICATIONS',
    })
    // applicationMethods() not neccessary, will be called by byWeb()
    // or byEmail(), included for clarity
    .applicationMethods()
    .byWeb({
      url: 'http://example.org',
      summary: 'summary text',
    })
    .byEmail({
      email: 'foo@example.org',
    })
    .numberToFill({
      number: 1,
    })
    .hiringOrgDescription({
      description: 'HIRING ORG DESCRIPTION',
    })
    .occupationGroup({
      code: 'OCCUPATION CODE',
    });
} catch (err) {
  console.log(err);
  if (err.isJoi) {
    console.log('-----');
    console.log(err.annotate());
  }
  process.exit(1);
}
const xmlString = request.toString();
console.log(xmlString);
```
