# Makefile used to do helm and terraform operations.  To enable locally, create
# a symlink to your local clones of
# https://github.com/circlefin/circle-helm-charts and
# https://github.com/circlefin/circle-terraform:
#     # run in root of repo
#     $ ln -s ../circle-helm-charts
#     $ ln -s ../circle-terraform
HELM_APP_DIR=./verity-verifier
HELM_RELEASE=verity-verifier-${TERRA_WORKSPACE}
HELM_NAMESPACE=verity
DB_SECRET_BASE=verity-verifier

# Inherit targets from common libs
-include ./circle-helm-charts/common/*.mk
-include ./circle-terraform/common/terraform.mk
