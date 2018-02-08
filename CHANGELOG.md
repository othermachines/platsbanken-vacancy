# Changelog
## 1.0.0 on 2018-02-07
- BACKWARDS INCOMPATIBLE CHANGE. Calls to hiringOrgContact() must be removed, and contact information supplied in the call to `hiringOrg({ name, id, url, contact, description})`. See changelog note for 0.5.0.
## 0.5.0 on 2018-02-07
- IMPORTANT. This version is broken. HiringOrg > OrganizationalUnit > Description must occur *after* HiringOrg > Contact, or it will be rejected by the Arbetsförmedling's API. If you are using hiringOrgContact(), the tags will occur in the wrong order.
- added optional description parameter to hiringOrg() <HiriginOrg><OrganizationalUnit><Description>
## 0.4.0 on 2018-01-31
- add additional contacts for further information (JPPExtension > InformationContact)
- add a reference ID (JPPExtension > ApplicationReferenceId)
## 0.3.0 on 2018-01-16
- corrected validation for municipality codes.
- benefits and compensation description are optional, do not count on them being set when validating.
- benefits summary text is required.
- validation fixes for termLength and scheduleType in classification.
- update dependencies.

## 0.2.0 on 2017-11-27
- changed signature for byWeb(), should not accept summary text.
- added "required" attribute when adding an "experience required" qualifcation().
This is the same as "yearsOfExperience", but that attribute has a misleading name,
referring not to how many years of experience the employer desires, but whether
experience is required (4) or not required (1).
- many changes and additions to the example scripts, including examples for
updating and deleting vacancies and the beginning of script that performs
Arbetsförmedling's API tests.

## 0.1.4 on 2017-11-02
- Did not increment version number in package.json before pushing last commit. Get more coffee.

## 0.1.3 on 2017-11-02
- Updated README and CHANGELOG from 0.1.2 were not saved before pusblishing.
No functional changes in this update, this just corrects the documentation.

## 0.1.2 on 2017-11-02
- When adding a qualifcation(), create the parent element if it does not exist.
Previously, calling qualification() without first calling qualificationsRequired()
or qualificationsRequiredSummary() would result in an error.
- Correct package name in tests.
- Move release notes from README to CHANGELOG.

## 0.1.1 on 2017-10-07
- Updated meta information.

## 0.1.0 on 2017-10-07
- Initial release.
