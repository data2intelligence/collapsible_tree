set.seed(123)
library(MUDAN)
setwd("/Users/_alanglanglang/Desktop/PhD-Lab/Cell.lineage.pilot/Web-Interface/tSNE_compare")
getwd()

scePath = "../../data/raw.data/E-MTAB-6149_NSCLC"
  
load(paste0(scePath,"_TPM.rda"))
load(paste0(scePath,"_meta.rda"))

### all
sc.matrix.anno.sub <- as.matrix(sc.matrix.anno[!sc.matrix.anno[,"uniformCellTypeSub"]%in%c("Malignant",NA),])
sc.matrix.data.sub <- sc.matrix.data[,rownames(sc.matrix.anno.sub)]

## variance normalize, identify overdispersed genes
matnorm.info <- normalizeVariance(sc.matrix.data.sub,details=TRUE,verbose=FALSE,alpha=0.05) 

## log transform
matnorm <- log10(matnorm.info$mat+1) 

## dimensionality reduction on overdispersed genes
pcs <- getPcs(matnorm[matnorm.info$ods,], 
              nGenes=length(matnorm.info$ods), 
              nPcs=30, 
              verbose=FALSE) 

perplexityPara = 30

cellTypeAnnoPath ="tSNE_plot_ranking/E-MTAB-6149_NSCLC_"
pdf(paste0(cellTypeAnnoPath, "gene_expr_top4rank_TCD8.pdf"))
par(mfrow=c(3,2), mar=rep(0.8,4))

## get tSNE embedding
temp <- Rtsne::Rtsne(pcs, 
                     is_distance=FALSE, 
                     perplexity=perplexityPara, 
                     check_duplicates = FALSE,
                     num_threads=parallel::detectCores(), 
                     verbose=FALSE)
emb <- temp$Y          
rownames(emb) <- rownames(pcs)

## markers To Compare (tSNE vs lineage tree)) 
sc.matrix.data.log <- log2(sc.matrix.data.sub+1)
markersToCompare <- c("CD8A","FIBP","GNLY","CCL3","GZMB","KLRF1")
# markersToCompare <- c("CD8A","FIBP","CCL5","GZMA","GNLY","GZMB")
# markersToCompare <- c("CD8A","FIBP","PTGDS","IGFBP7","GZMB","TIMP1")

invisible(lapply(markersToCompare, function(g) {
  plotEmbedding(emb, color=sc.matrix.data.log[g,], 
                main=g, xlab=NA, ylab=NA, 
                mark.clusters=TRUE, alpha=0.5, mark.cluster.cex=1, 
                show.legend=FALSE,legend.x="topright",
                verbose=FALSE) 
}))

dev.off()