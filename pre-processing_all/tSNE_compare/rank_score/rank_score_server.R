library(ggplot2)
library(ggpubr)
library(ggrepel)
library(dplyr)
library(tidyr)
library(MUDAN)
set.seed(123)

setwd("/nfshomes/yg61/Cell_lineage")
getwd()

# Loop through all 10 datasets in the sce folder
TPM_file_list <- list.files(path = "data/sce", pattern = "_TPM.rda")
meta_file_list <- list.files(path = "data/sce", pattern = "_meta.rda")

len = length(TPM_file_list)
# for (i in 1:len) {
i =1
  TPM_file = TPM_file_list[i]
  meta_file = meta_file_list[i]
  
  # create folder for each datasets
  folder_name = gsub('_TPM.rda','',TPM_file)
  folder_path = paste0("lineage_visualization/tSNE_compare/output_all_datasets/",folder_name )
  
  if(!dir.exists(folder_path)){
    dir.create(folder_path)
  }else{
    print("dir exists")
  }

  # Load matrix   *** row = gene; col = cell barcode ***
  load(file = paste0("data/sce/", TPM_file))
  matrix <- sc.matrix.data
  matrix_T <- as.data.frame(t(matrix)) # Now ***row = cell, col = gene ***
  gene_list <- colnames(matrix_T)
  
  # Load meta data.  **** row= cell barcode ;col = metadata ****
  # csv vs. load rda ==> in rda, cellbarcode = index;;; csv cellbarcode == #1 col
  load(file = paste0("data/sce/", meta_file))
  meta <- sc.matrix.anno
  
  anno <- as.data.frame(meta[, c("uniformCellType", "uniformCellTypeSub")])
  colnames(anno) <- c("uniformCellType", "uniformCellTypeSub")
  
  # concatenate matrix with anno
  merge <- cbind(matrix_T, anno)
  print(dim(merge))
  
  #------------------Sub cell type------------------
  anno_sub = as.data.frame(meta[,"uniformCellTypeSub"])
  colnames(anno_sub) = "uniformCellTypeSub"
  
  # concatenate matrix with anno
  merge_sub = cbind(matrix_T,anno_sub) 
  
  # group by Sub cell type, calc mean and size
  sub_df = merge_sub %>% group_by(uniformCellTypeSub) %>%
    mutate(sub_size=n())
  sub_df = sub_df %>% group_by(uniformCellTypeSub) %>%
    summarise(across(everything(), mean))
  
  # *** Modification: remove "Malignant", remove NA, make Plasma a subgroup of B cell ***
  sub_df = subset(sub_df,uniformCellTypeSub!= "Malignant" )
  sub_df = subset(sub_df,uniformCellTypeSub!= "pDC" )
  # *** [sub_df col: subcelltype, gene_1,....gene_n, sub_size] ***
  # *** dim(sub_df)[2] == length(gene_list)+2 ***
  
  #log normalization
  len = length(gene_list)
  sub_df[,2:(len+1)] = t(apply(sub_df[,2:(len+1)], 1, function(x) log2(x/10+1)))
  sub_df[,2:(len+1)] = round(sub_df[,2:(len+1)] , digits = 2)
  
  # get structure of cell types
  anno_structure = unique(anno)
  anno_structure = anno_structure %>% drop_na(uniformCellTypeSub)
  anno_structure[anno_structure$uniformCellTypeSub=='Plasma',"uniformCellType"] = "B cell"
  
  # recover major-sub relationship 
  sub_df = merge(x = anno_structure, y = sub_df , by="uniformCellTypeSub", all.y = TRUE)
  
  sub_df = sub_df %>% drop_na(uniformCellTypeSub)
  # *** [sub_df --> col: majorcelltype, subcelltype, gene_1,....gene_n, sub_size] ***
  # ***  sub_df --> number of cols = gene list + 3. ***
  # write.csv(sub_df, file = paste0(folder_path,"/mean_by_subgroup_all_gene.csv"))
  
  #------------------ Add more lineage hierarchies ------------------
  level_3 = data.frame('uniformCellType' = c('T CD4','T CD8','cDC','pDC','Mast','Macrophage','NK','B cell','CAF','Endothelial','Plasma'),
                       'level_3' = c('T cell', 'T cell','Myeloid','Myeloid','Myeloid','Myeloid','NK','B cell','CAF','Endothelial','Pasma'))
  multi_level_df = merge(x = level_3, y = sub_df, by ="uniformCellType", all.y = TRUE )
  # *** [multi_level_df --> col: level3celltype, majorcelltype, subcelltype, gene_1,....gene_n, sub_size] ***
  # ***  multi_level_df --> number of cols = gene list + 4. ***
  # write.csv(multi_level_df, file = paste0(folder_path, "/mean_by_multi_level_all_gene.csv"))
  
  #------------------ Major df ------------------
  major_df = multi_level_df %>% group_by(uniformCellType) %>% summarise(child_num = n(), major_size = sum(sub_size))
  
  for (gene in gene_list){
    df = multi_level_df[,c("uniformCellType","sub_size",gene)]
    colnames(df) = c("uniformCellType","sub_size","gene")
    df = df %>% group_by(uniformCellType) %>% summarise(weighted_mean = weighted.mean(gene,sub_size)) 
    major_df = cbind(major_df, df$weighted_mean)
  }
  colnames(major_df) = c("uniformCellType","child_num", "major_size",gene_list)
  # write.csv(major_df, file = paste0(folder_path, "/mean_by_majorgroup_all_gene.csv"))
  
  #------------------ Level-3 df ------------------
  level_3_df = multi_level_df %>% group_by(level_3) %>% summarise(child_num = n(), level_3_size = sum(sub_size))
  
  for (gene in gene_list){
    df = multi_level_df[,c("level_3","sub_size", gene)]
    colnames(df) = c("level_3","sub_size","gene")
    df = df %>% group_by(level_3) %>% summarise(weighted_mean = weighted.mean(gene,sub_size)) 
    level_3_df = cbind(level_3_df, df$weighted_mean)
  }
  colnames(level_3_df) = c("level_3","child_num", "level_3_size",gene_list)
  # *** [level_3_df --> col: as shown in the line above] ***
  # *** level_3_df --> number of cols = gene list + 3. ***
  
  #------------------ Scoring- macro  ------------------

  min_2 = level_3_df %>% filter(level_3 %in% c("T cell","Myeloid") ) %>%
    summarise(across(where(is.numeric), ~min(.x)))
  max_other =  level_3_df %>% filter(!level_3 %in% c("T cell","Myeloid") ) %>%
    summarise(across(where(is.numeric), ~max(.x)))
  
  macro_score = rbind(min_2, max_other)
  # delete first 2 col: child_num and level_3_size
  macro_score = macro_score[1:2, 3:(dim(macro_score)[2])] 
  macro_score[3,] = macro_score[1,] -macro_score[2,] 
  rownames(macro_score) = c("min_2","max_other", "macro_score")
  # test_macro = macro_score[1:3,1:3]
  # test_macro_t = t(apply(test_macro, 1, function(x) x/sum(x)))
  
  ##### debug: 03/29/23
  # macro_score_t = t(apply(macro_score, 1, function(x) x/sum(x)))
  # what does the equation do above:normalize by row(e.g. min2 across all gene)
  # There is no need to normalize. The scale of value unchanged.So they are comparable.
  # the errors are made when normalize: negative value / sum(also negative ) = large positve value<- wrong
  
  # data = as.data.frame(t(macro_score))
  # colnames(data) = c("min_2","max_other","macro")
  # p = ggplot(data, aes(macro)) + geom_histogram(binwidth = 0.05)
  # png("lineage_visualization/tSNE_compare/output_test_dataset/macro_dist_normalized.png", width = 1000, height = 400)
  # print(p)
  # dev.off()
  
  #------------------ Scoring- micro  ------------------
  micro_brch = function(df, cellType){
    df = df %>% filter( uniformCellType == cellType) 
    min = df %>% summarise(across(where(is.numeric), ~min(.x)))
    max = df %>% summarise(across(where(is.numeric), ~max(.x)))
    return (max-min)
    }
  micro_brch_lv3 = function(df, cellType){
    df = df %>% filter(level_3 == cellType) 
    min = df %>% summarise(across(where(is.numeric), ~min(.x)))
    max = df %>% summarise(across(where(is.numeric), ~max(.x)))
    return (max-min)
  }
  
  col_num_for_size = dim(sub_df)[2] ## last col => size, is numeric
  sub_df_remove_size = sub_df[, -c(col_num_for_size)] 
  
  multi_level_df_remove_size = multi_level_df[,-c(dim(multi_level_df)[2])]
  micro_brch_df = rbind('micro_T8' = micro_brch(sub_df_remove_size, "T CD8") ,
                        'micro_T4'= micro_brch(sub_df_remove_size, "T CD4"),
                        'micro_Myeloid' = micro_brch_lv3(multi_level_df_remove_size,"Myeloid"))
  #### skip this part! 
  # normalize every row to 1
  # micro_brch_df = t(apply(micro_brch_df, 1, function(x) x/sum(x)))
  
  score_df = rbind(macro_score, micro_brch_df)
  score_df = as.data.frame(t(score_df))
  score_df = as.data.frame(score_df)
  
  #------------------------------------
  # [old method!]Get the final score = marco + micro
  # final_df = mutate(score_df, final_T8 = macro_score + micro_T8,
  #                   final_T4 = macro_score + micro_T4,
  #                   final_Myeloid = macro_score + micro_Myeloid)
  # 
  # write.csv(final_df, file = paste0(folder_path, "/final_score.csv"))
  # 
  # final_score <- read.csv(paste0(folder_path,"/final_score.csv"))
  # rownames(final_score) = final_score$X
  #------------------------------------
  
  #------------------------------------
  # [new method: we display the marco and micro(3 lineage) in 2D plot. 
  # And select the dots in the right-upper corner]
  #------------------------------------
  write.csv(score_df, file = paste0(folder_path, "/score_df.csv"))

  #------------------------------------
  # [new method: we display the marco and micro(3 lineage) in 2D plot]
  
  # If not reading score_df.csv, skip these 2 lines 
  # colnames(score_df)[1] = "gene_name"
  # rownames(score_df) = score_df$gene_name
  score_df$gene_name = rownames(score_df)
  p99_macro = quantile(score_df$macro_score, 0.99)
  options(ggrepel.max.overlaps = Inf)
  scatter_score = function(score_df, lineage){
    p99_micro = quantile(score_df[[lineage]], 0.99)
    reference_df = score_df[c("FIBP", "AOAH"),]
    top_mtx = filter(score_df, macro_score > p99_macro & !!as.symbol(lineage) > p99_micro) 
    
    p = ggplot(score_df, aes(x = !!as.symbol(lineage), y = macro_score))+ geom_point()+
      geom_point(data = reference_df , aes(x = !!as.symbol(lineage), y = macro_score, color = "red"))+
      geom_label_repel(data = reference_df , aes(!!as.symbol(lineage),macro_score, label = gene_name), vjust=1)+
      
      geom_point(data = top_mtx, aes(x =!!as.symbol(lineage), y = macro_score, color = "red"))+
      geom_label_repel(data = top_mtx , aes(!!as.symbol(lineage),macro_score, label = gene_name), vjust=1)+
      theme(legend.position = "none") 
    
  }
  T8 = scatter_score(score_df,"micro_T8")
  T4 = scatter_score(score_df,"micro_T4")
  Myeloid = scatter_score(score_df,"micro_Myeloid")
  
  p <- ggarrange(T8, T4, Myeloid, ncol =3, nrow =1 )
  p <- annotate_figure(p, 
                       top = text_grob("Macro score vs micro score for three linegaes \n Threshold: > quantile 0.99 for both", size = 24))
  
  png(paste0(folder_path,"/score_scatterplot.png"), width = 1600, height = 800)
  print(p)
  dev.off()
  
  lineage_list = c("micro_T8","micro_T4","micro_Myeloid")

  top_gene = c()
  top_gene_txt = c()
  for (lineage in lineage_list){
    p99_micro = quantile(score_df[[lineage]], 0.99)
    top_mtx = filter(score_df, macro_score > p99_macro & !!as.symbol(lineage) > p99_micro)
    top_gene_list = list(rownames(top_mtx) )
    top_gene =c(top_gene, top_gene_list)
    top_gene_txt = c(top_gene_txt, lineage, rownames(top_mtx),"\n")
    }
  writeLines(top_gene_txt, paste0(folder_path,"/top_gene.txt"))
  
  #------------------ tSNE - plotting  ------------------
  
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
  
  ## m= c("micro_T8", "micro_T4", "micro_Myeloid")
  for (i in 1:3){
    lineage = m[i]
    png(paste0(folder_path, "/top_gene_tSNE_",lineage,".png"), width = 1600, height = 1600)
    par(mfrow=c(3,3),mar=rep(0.8,4))
    
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
    top7_gene = top_gene[[i]][1:7]
    
    markersToCompare = c()
    markersToCompare <- c("CD8A","FIBP",top7_gene)
    markersToCompare = markersToCompare[!is.na(markersToCompare)]
    invisible(lapply(markersToCompare, function(g) {
      plotEmbedding(emb, color=sc.matrix.data.log[g,], 
                    main=g, xlab=NA, ylab=NA, 
                    mark.clusters=TRUE, alpha=0.5, mark.cluster.cex=1, 
                    show.legend=FALSE,legend.x="topright",
                    verbose=FALSE) 
    }))
    
    dev.off()
  }

  
  





