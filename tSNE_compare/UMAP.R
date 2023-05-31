set.seed(123)
library(dplyr)
library(Seurat)
library(patchwork)
library(ggplot2)
# setwd("/Users/ygao61/Desktop/PhD-Lab/Cell.lineage.pilot/lineage_visualization/tSNE_compare")
getwd()

scePath = "../../sce/E-MTAB-6149_NSCLC"
  
load(paste0(scePath,"_TPM.rda"))
load(paste0(scePath,"_meta.rda"))

### all
sc.matrix.anno.sub <- as.matrix(sc.matrix.anno[!sc.matrix.anno[,"uniformCellTypeSub"]%in%c("Malignant",NA),])
sc.matrix.data.sub <- sc.matrix.data[,rownames(sc.matrix.anno.sub)]


mtx.data <- CreateSeuratObject(counts = sc.matrix.data.sub, project = "sce")

mtx.data <- NormalizeData(mtx.data, normalization.method = "LogNormalize", scale.factor = 10000)

# ??? diff pre-process in tSNE and UMAP

# ## variance normalize, identify overdispersed genes
# matnorm.info <- normalizeVariance(sc.matrix.data.sub,details=TRUE,verbose=FALSE,alpha=0.05) 
# 
# ## log transform
# matnorm <- log10(matnorm.info$mat+1)

# feature selection
mtx.data <- FindVariableFeatures(mtx.data, selection.method = "vst", nfeatures = 2000)

# scaling the data
all.genes <- rownames(mtx.data)
mtx.data <- ScaleData(mtx.data, features = all.genes)

mtx.data <- RunPCA(mtx.data, features = VariableFeatures(object = mtx.data))
mtx.data <- RunUMAP(mtx.data, dims = 1:30)
DimPlot(mtx.data, reduction = "umap")
saveRDS(mtx.data, file = "output_UMAP/UMAP_tutorial.rds")
