import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ErrorResponse } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { NotificationService } from '@services/notification.service';
import { SettingsService } from '@services/settings.service';
import { finalize } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import { PathConstant } from '@common/constants/path.constant';
import { TranslateService } from '@ngx-translate/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { MapConstant } from '@common/constants/map.constant';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  selector: 'app-export-form',
  templateUrl: './export-form.component.html',
  styleUrls: ['./export-form.component.scss'],
})
export class ExportFormComponent implements OnInit {
  submittingForm = false;
  exportForm = new UntypedFormGroup({
    export: new UntypedFormControl(null, Validators.required),
    as_standalone: new UntypedFormControl(false),
  });
  isExportAuthorized!: boolean;
  importMsg: any;
  get isImportAuthorized() {
    return (
      GlobalVariable.user.token.role === MapConstant.FED_ROLES.FEDADMIN ||
      (GlobalVariable.user.token.role === MapConstant.FED_ROLES.ADMIN &&
        (GlobalVariable.isStandAlone || GlobalVariable.isMember))
    );
  }

  constructor(
    private settingsService: SettingsService,
    private tr: TranslateService,
    private utils: UtilsService,
    private authUtilsService: AuthUtilsService,
    private notificationService: NotificationService
  ) {
    this.importMsg = {
      success: this.tr.instant('setting.message.UPLOAD_FINISH'),
      error: this.tr.instant('setting.IMPORT_FAILED'),
    };
  }

  get importUrl(): string {
    return PathConstant.SYSTEM_CONFIG_URL;
  }

  get as_standalone(): boolean {
    return this.exportForm.get('as_standalone')?.value;
  }

  ngOnInit(): void {
    this.isExportAuthorized =
      this.authUtilsService.getDisplayFlag('write_config');
  }

  submitExport(): void {
    const exportMode = this.exportForm.get('export')?.value;
    this.submittingForm = true;
    this.settingsService
      .getSystemConfig(exportMode)
      .pipe(
        finalize(() => {
          this.submittingForm = false;
        })
      )
      .subscribe(
        data => {
          let exportUrl = new Blob([data], {
            type: 'application/zip',
          });
          let fileName =
            exportMode && exportMode.toLowerCase() === 'all'
              ? `NV${this.utils.parseDatetimeStr(new Date())}.conf.gz`
              : `NV${this.utils.parseDatetimeStr(new Date())}_policy.conf.gz`;
          saveAs(exportUrl, fileName);
        },
        ({ error }: { error: ErrorResponse }) => {
          this.notificationService.open(
            this.tr.instant('setting.EXPORT_FAILED'),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
          console.warn(error);
        }
      );
  }
}
